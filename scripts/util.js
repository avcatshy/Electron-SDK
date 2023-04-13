const os = require('os');

const fs = require('fs-extra');

const getConfig = require('./getConfig');
const logger = require('./logger');

exports.getOS = () => {
  const { platform } = getConfig();
  if (platform === 'darwin') {
    return 'mac';
  } else if (platform === 'win32') {
    return 'win32';
  } else {
    // not supported in temp
    logger.error('Unsupported platform!');
  }
};

exports.createTmpDir = async () => await fs.mkdtemp(`${os.tmpdir()}_AgoraTmp`);
