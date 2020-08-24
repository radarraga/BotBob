const Discord   = require('discord.js');
const bot       = new Discord.Client();
const https     = require('https');
const { connect } = require('http2');
const request   = require('request');

require('dotenv').config({path: __dirname + '/.env'});
bot.login(process.env.TOKEN);


bot.on('ready', () =>{
    console.info(`Logged in as ${bot.user.tag}`);
});

const { OpusEncoder } = require('@discordjs/opus');
const { toUnicode } = require('punycode');
const { kMaxLength } = require('buffer');
 
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

        case 'wetter':
            const options = {
                url: 'https://api.openweathermap.org/data/2.5/weather?lat=47.498&lon=8.278&appid=' + process.env.OPEN_WEATHER_API,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Charset': 'utf-8',
                    'User-Agent': 'my-reddit-client'
                }
            };
            
            request(options, function(err, res, body) {
                let json = JSON.parse(body);
                msg.channel.send('Auf dem Tromsberg hat es ' + parseInt(json.main.temp - 273.15) + '°C und ' + json.weather[0].description );
            });
            break;

        case 'stop':
            msg.member.voice.channel.leave();
            isPlaying = false;
            break;
        
        case 'kollegah':
            var track = './Audio/Kollegah' + Math.floor(Math.random() * 5) + '.mp3';
            PlayMedia(msg, track, 0.3);
            break;
        
        case 'hi':
            PlayMedia(msg, './Audio/hi.mp3');
            break;

        case 'nice':
            var track = './Audio/nice' + Math.floor(Math.random() * 6) + '.mp3';
            PlayMedia(msg, track);
            break;

    
        default:
            msg.channel.send("Ah, ich hab' verkackt, mir ist egal");
            PlayMedia(msg, './Audio/Verkackt.mp3', 0.3);
	        break;
    }
});


function PlayMedia(msg, file, volume = 0.5){
    var channel = msg.member.voice.channel;
    if(channel != null && isPlaying === false){
        channel.join().then(connection => {
            const dispatcher = connection.play(file);
            isPlaying = true;
            dispatcher.setVolume(volume);
            dispatcher.on("finish", end =>
            {
                channel.leave();
                isPlaying = false;
            });
        }).catch(err => console.log(err));
    }
}
