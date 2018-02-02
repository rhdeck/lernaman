const yarnif = require("yarnif");
const glob = require("glob");
const fs = require("fs");
const Path = require("path");
const rimraf = require("rimraf");
const cp = require("child_process");
const basedir = process.cwd();
function addLerna(info, name, basedir) {
  if (!basedir) basedir = process.cwd();
  if (typeof info == "string") {
    if (info.indexOf("://") > -1) {
      info = { git: info };
    } else {
      info = { path: info };
    }
  }
  info = info ? info : {};
  if (name) info.name = name;
  if (info.git) {
    if (typeof info.git == "string") {
      info.git = { url: info.git };
    }
    if (!info.git.url) {
      //We cannot work with this
      console.log("info", info);
      return false;
    }
    if (!info.name) {
      info.name = info.git.url.split("/").pop();
    }
    try {
      const p = require(Path.resolve(basedir, "package.json"));
      if (!p.makeApp) p.makeApp = {};
      if (!p.makeApp.lernas) p.makeApp.lernas = {};
      p.makeApp.lernas[info.name] = info;
      fs.writeFileSync(
        Path.resolve(basedir, "package.json"),
        JSON.stringify(p)
      );
      return info;
    } catch (e) {
      return false;
    }
  } else if (info.path) {
    if (!info.name) {
      info.name = Path.basename(info.path);
    }
    try {
      const p = require(Path.resolve(basedir, "package.json"));
      if (!p.makeApp) p.makeApp = {};
      if (!p.makeApp.lernas) p.makeApp.lernas = {};
      p.makeApp.lernas[info.name] = info;
      fs.writeFileSync(
        Path.resolve(basedir, "package.json"),
        JSON.stringify(p)
      );
      return info;
    } catch (e) {
      return false;
    }
  }
}
function removeLerna(name, basedir) {
  if (!basedir) basedir = process.cwd();
  try {
    rimraf.sync(Path.join(basedir, getLernaPath, name));
  } catch (e) {}
  try {
    const p = require(Path.resolve(basedir, "package.json"));
    if (!p.makeApp) return true;
    if (!p.makeApp.lernas) return true;
    delete p.makeApp.lernas[info.name];
    fs.writeFileSync(Path.resolve(basedir, "package.json"), JSON.stringify(p));
    return true;
  } catch (e) {
    return false;
  }
}
function getSpawnOptions(basedirs) {
  if (typeof basedirs == "string") basedirs = [basedirs];
  if (!basedirs) basedirs = [];
  return {
    stdio: "inherit",
    env: {
      ...process.env,
      path: process.env.path + ";" + basedirs.join(";")
    }
  };
}
var lernaInfo = {
  path: "lernas"
};
function getLernaPath() {
  return lernaInfo.path;
}
function getLernas(basedir) {
  if (!basedir) basedir = process.cwd();
  //read my package
  const packagePath = Path.resolve(basedir, "package.json");
  if (!fs.existsSync(packagePath)) return false;
  const p = require(packagePath);
  if (p && p.makeApp && p.makeApp.lernas) {
    const ls = p.makeApp.lernas;
    return ls;
  }
  return false;
}
function initLernas(basedir) {
  if (!basedir) basedir = process.cwd();
  walkLernas(basedir, (k, lerna, basedir) => {
    initLerna(k, lerna, basedir);
  });
}
function updateLernas(basedir) {
  walkLernas(basedir, (k, lerna, basedir) => {
    updateLerna(k, lerna, basedir);
    linkLerna(k, lerna, basedir);
  });
}
function linkLernas(basedir) {
  walkLernas(basedir, (k, lerna, basedir) => {
    linkLerna(k, lerna, basedir);
  });
}
function walkLernas(basedir, cb) {
  if (!basedir) basedir = process.cwd();
  const ls = getLernas(basedir);
  if (ls) {
    Object.keys(ls).forEach(k => {
      const v = ls[k];
      cb(k, v, basedir);
    });
  }
}
function initLerna(path, lerna, basedir) {
  if (!basedir) basedir = process.cwd();

  const lernadir = Path.join(basedir, getLernaPath(), path);
  if (!fs.existsSync(Path.dirname(lernadir))) {
    fs.mkdirSync(Path.dirname(lernadir));
  }
  if (!lerna) lerna = getLernas(basedir)[path];
  if (!fs.existsSync(lernadir)) {
    //Lets make it happen
    if (lerna.git) {
      if (typeof lerna.git == "string") {
        lerna.git = { url: lerna.git };
      }
      var branchinfo = [];
      if (lerna.git.branch) {
        branchinfo.push("-b");
        branchinfo.push(lerna.git.branch);
      }
      cp.spawnSync(
        "git",
        ["clone", ...branchinfo, lerna.git.url, lernadir],
        getSpawnOptions(basedir)
      );
    }
    if (lerna.path) {
      //Just symlink from the path
      fs.symlinkSync(lerna.path, lernadir);
    }
  }
}
function updateLerna(path, lerna, basedir) {
  if (!basedir) basedir = process.cwd();
  process.chdir(Path.join(basedir, getLernaPath(), path));
  yarnif.install();
  yarnif.exec(["lerna", "bootstrap"]);
  yarnif.exec(["lerna", "run", "prebuild"]);
  yarnif.exec(["lerna", "run", "build"]);
  yarnif.exec(["lerna", "run", "postbuild"]);
  yarnif.exec(["lerna", "run", "link"]);
  process.chdir(basedir);
}
function linkLerna(path, lerna, basedir) {
  if (!basedir) basedir = process.cwd();
  process.chdir(Path.join(basedir, getLernaPath(), path));
  const lernapath = fs.readFileSync("lerna.json");
  const lernapackage = JSON.parse(lernapath);
  if (lernapackage) {
    const thisdir = process.cwd();
    const packages = lernapackage.packages || [];
    packages.forEach(g => {
      glob.sync(g).forEach(packagepath => {
        const fullpackagepath = Path.join(thisdir, packagepath);
        const packageobj = require(Path.join(fullpackagepath, "package.json"));
        const name = packageobj.name;
        const targetdir = Path.join(basedir, "node_modules", name);
        const parent = Path.dirname(targetdir);
        if (!fs.existsSync(parent)) {
          const nm = Path.dirname(parent);
          if (!fs.existsSync(nm)) {
            fs.mkdirSync(nm);
          }
          fs.mkdirSync(parent);
        }
        if (fs.existsSync(targetdir)) fs.unlinkSync(targetdir);
        rimraf.sync(targetdir);
        console.log("Linking", fullpackagepath, "to", targetdir);
        fs.symlinkSync(fullpackagepath, targetdir);
      });
    });
  }
  process.chdir(basedir);
}
module.exports = {
  add: addLerna,
  initAll: initLernas,
  updateAll: updateLernas,
  linkAll: linkLernas,
  walk: walkLernas,
  link: linkLerna,
  init: initLerna,
  update: updateLerna,
  remove: removeLerna
};
