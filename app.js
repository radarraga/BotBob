const Discord   = require('discord.js');
const bot       = new Discord.Client();
const https     = require('https');
const { connect } = require('http2');
const request   = require('request');
const mongoose  = require('mongoose');

const Player	= require('./models/player.js');

var url = "mongodb://localhost:27017/botbob";

require('dotenv').config({path: __dirname + '/.env'});
bot.login(process.env.TOKEN);

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
	console.log('connected to the db!')
}).catch(err => {
	console.log('Error connecting to the db: ' + err.message)
});

var commands = require('./commands.json');

bot.on('ready', () =>{
    console.info(`Logged in as ${bot.user.tag}`);
});

const { OpusEncoder } = require('@discordjs/opus');
const { toUnicode } = require('punycode');
const { kMaxLength } = require('buffer');
const { Z_NEED_DICT } = require('zlib');
const { isNull } = require('util');
const { disconnect } = require('process');
const { map } = require('async');
const { update } = require('./models/player.js');
 
var isPlaying = false;

bot.on('message', async function(msg) {
    if(!msg.content.startsWith('!')) return;
    if(msg.channel.name != 'bot') return;
    var message = msg.content.substring(1).toLowerCase();

    var messageSent = false;
    
    commands.forEach(command => {
        if(command.name === message){
            messageSent = true;
            if(command.type === 'message') msg.channel.send(command.message);
            else if(command.type === 'audio') PlayMedia(msg, command.file, command.volume);
            else if(command.type === 'randomAudio'){
                var number = Math.floor(Math.random() * command.file.length);
                var volume = 0.5;
                if (command.volume) volume = command.volume[number];
                PlayMedia(msg, command.file[number], volume);
            }
        }
    });

    if(message.substring(0,6) === 'insult'){
        messageSent = true;
        var mentionedUser = msg.mentions.users.first();

        if(message.replace(/ /g, '').substring(6) == '@everyone'){
            https.get('https://insult.mattbas.org/api/en/insult.txt?who=', (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    msg.channel.send('@everyone' + data);
                });
            });
            return;
        }

        if(mentionedUser === undefined) 
        {
            msg.channel.send('<@' + msg.author.id + '> is too stupid to insult someone.');
            return;
        }

        if(mentionedUser['id'] === bot.user.toJSON().id)
        {
            msg.channel.send('Idiot.');
            return;
        }
        
        https.get('https://insult.mattbas.org/api/en/insult.txt?who=', (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                msg.channel.send('<@' + mentionedUser['id'] + '>' + data);
            });
        });
    }

    if(!messageSent){
        switch (message) {
            case 'wetter':
                var options = {
                    url: 'https://api.openweathermap.org/data/2.5/weather?lat=47.498&lon=8.278&lang=de&appid=' + process.env.OPEN_WEATHER_API,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Charset': 'utf-8',
                        'User-Agent': 'my-reddit-client'
                    }
                };
                
                request(options, function(err, res, body) {
                    let json = JSON.parse(body);
                    const weatherEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("Wetter auf dem Tromsberg")
                        .addFields(
                            {name: "Temperatur", value: parseInt(json.main.temp - 273.15) + '°C'},
                            {name: 'Beschreibung', value: json.weather[0].description},
                            {name: "Wind", value: parseInt(json.wind.speed * 3.6)+ ' km/h'}
                        )
                        .setThumbnail('http://openweathermap.org/img/wn/' + json.weather[0].icon + '@2x.png')
                    msg.channel.send(weatherEmbed);
                });
                break;
            
            case 'wetterm':
                var options = {
                    url: 'https://api.openweathermap.org/data/2.5/weather?lat=48.154&lon=11.471&lang=de&appid=' + process.env.OPEN_WEATHER_API,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Charset': 'utf-8',
                        'User-Agent': 'my-reddit-client'
                    }
                };
                
                request(options, function(err, res, body) {
                    let json = JSON.parse(body);
                    const weatherEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("Wetter in München")
                        .addFields(
                            {name: "Temperatur", value: parseInt(json.main.temp - 273.15) + '°C'},
                            {name: 'Beschreibung', value: json.weather[0].description},
                            {name: "Wind", value: parseInt(json.wind.speed * 3.6)+ ' km/h'}
                        )
                        .setThumbnail('http://openweathermap.org/img/wn/' + json.weather[0].icon + '@2x.png')
                    msg.channel.send(weatherEmbed);
                });
                break;
            
            case 'init':
                Init(msg);
                break;

            case 'update':
                Update(msg);
                break;
        
            case 'idiots':
                Player.find(function(err, players){
                    players.sort(function(a,b){
                        if(parseInt(a.points) > parseInt(b.points)) return -1;
                        if(parseInt(a.points) < parseInt(b.points)) return 1;
                        return 0;
                    });

                    var fields = [];

                    players.forEach(player => {
                        field = {'name': player.name, 'value': player.points};
                        fields.push(field);
                    });
                    const playersEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Players')
                        .addFields(fields)
                    msg.channel.send(playersEmbed);                    
                });
                break;
	
            case 'stop':
                if(isPlaying && msg.member.voice.channel != null) msg.member.voice.channel.leave();
                isPlaying = false;
                break;

            case 'help':
                var fields = [];
                commands.forEach(command => {
                    field = {'name': '!' + command.name, 'value': command.description};
                    fields.push(field);
                });
                const helpEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Nearly all Commands')
                    .addFields(fields)
                    .attachFiles(['./Images/embed.png'])
                    .setThumbnail('attachment://embed.png')
                msg.channel.send(helpEmbed);
                break;
        
            default:
                msg.channel.send("Ah, ich hab' verkackt, mir ist egal");
                PlayMedia(msg, 'Verkackt.mp3', 0.3);
                break;
        }
    }
});

async function Init(msg){
    var members = msg.guild.members.fetch();


    Promise.resolve(members).then(function(value){
        value.forEach(member => {
            Player.findOne({id: member['id']}, function(err, foundPlayer){
                if (err){
                    console.log(err);
                    return;
                }else{
                    if(foundPlayer) console.log(member['id'] + ' already registered.');
                    else{
                        console.log('saving with id ' + member['id']);
                        new Player({name: member['nickname'], id: member['id']}).save();
                    } 
                }
            });
        });
    });
}


function Update(msg){
    var members = msg.guild.members.fetch();


    Promise.resolve(members).then(function(value){
        value.forEach(member => {
            Player.findOne({id: member['id']}, function(err, foundPlayer){
                if (err){
                    console.log(err);
                    return;
                }else{
                    if(foundPlayer) {
                        foundPlayer.name = member['nickname'];
                        foundPlayer.save();
                    };
                    
                }
            });
        });
    });
}


function PlayMedia(msg, file, volume = 0.5){
    var channel = msg.member.voice.channel;
    file = './Audio/' + file;
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
