export function cleanChannelName(channel) {
    return channel.toLowerCase().replace(/( |-)/, '_');
}