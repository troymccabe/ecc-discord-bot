let arch = require('arch')

const homedir = require('os').homedir();
let walletName = process.env.WALLET_NAME;
let daemonName = process.env.DAEMON_NAME;

export function getDaemonFileName() {
    if (process.platform === 'linux') {

        return arch() === 'x86' ? `${daemonName}-linux32` : `${daemonName}-linux64`;

    } else if (process.platform === 'darwin') {

        return `${daemonName}.app`;

    } else if (process.platform.indexOf('win') > -1) {

        return arch() === 'x86' ? `${daemonName}-win32.exe` : `${daemonName}-win64.exe`;
    }
}

export function grabDaemonDir() {
    if (process.platform === 'linux') {
        // linux directory
        return `${homedir}/.${walletName}/`;
    } else if (process.platform === 'darwin') {
        // OSX
        return `${homedir}/Library/Application Support/.${walletName}/`;
    } else if (process.platform.indexOf('win') > -1) {
        // Windows
        return `${homedir}\\.${walletName}\\`;
    }
}

export function grabCoreDir() {
    if (process.platform === 'linux') {
        // linux directory
        return `${homedir}/.eccoin/`;
    } else if (process.platform === 'darwin') {
        // OSX
        return `${homedir}/Library/Application Support/eccoin/`;
    } else if (process.platform.indexOf('win') > -1) {
        // Windows
        return `${homedir}\\Appdata\\roaming\\eccoin\\`;
    }
}

export function getDaemonFullPath() {
    if (process.platform === 'linux') {
        // linux directory
        return `${grabDaemonDir()}${getDaemonFileName()}`;
    } else if (process.platform === 'darwin') {
        // OSX
        return `${grabDaemonDir()}${getDaemonFileName()}/Contents/MacOS/eccoind`;
    } else if (process.platform.indexOf('win') > -1) {
        // Windows
        return `${grabDaemonDir()}${getDaemonFileName()}`;
    }
}

export function getConfUri() {
    return `${grabCoreDir()}eccoin.conf`;
}

export function getDebugUri() {
    return `${grabCoreDir()}debug.log`;
}

