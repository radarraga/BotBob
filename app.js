const Discord   = require('discord.js');
const bot       = new Discord.Client();
const https     = require('https');
const { connect } = require('http2');

require('dotenv').config({path: __dirname + '/.env'});
bot.login(process.env.TOKEN);


bot.on('ready', () =>{
    console.info(`Logged in as ${bot.user.tag}`);
});

const { OpusEncoder } = require('@discordjs/opus');
const { toUnicode } = require('punycode');
 
var isPlaying = false;

bot.on('message', msg => {
    if(!msg.content.startsWith('!')) return;
    var message = msg.content.substring(1).toLowerCase();
    switch (message) {
        case 'gay':
            //var user = msg.guild.members.random();
            msg.channel.send('Nice');
            break;

        case 'insult':
            https.get('https://insult.mattbas.org/api/en/insult.txt', (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    msg.channel.send(data);
                });
            });
            break;

        case 'stop':
            msg.member.voice.channel.leave();
            isPlaying = false;
            break;
        
        case 'kollegah':
            var channel = msg.member.voice.channel;
            var track = './Audio/Kollegah' + Math.floor(Math.random() * 5) + '.mp3';
            PlayMedia(channel, track);
            break;
        
        case 'hi':
            var channel = msg.member.voice.channel;
            PlayMedia(channel, './Audio/hi.mp3');
            break;

    
        default:
            msg.channel.send("Ah, ich hab' verkackt, mir ist egal");
            var channel = msg.member.voice.channel;

            PlayMedia(channel, './Audio/Verkackt.mp3');
	        break;
    }
});


function PlayMedia(channel, file){
    if(channel != null && isPlaying === false){
        channel.join().then(connection => {
            const dispatcher = connection.play(file);
            isPlaying = true;
            dispatcher.setVolume(0.5);
            dispatcher.on("finish", end =>
            {
                channel.leave();
                isPlaying = false;
            });
        }).catch(err => console.log(err));
    }
}
