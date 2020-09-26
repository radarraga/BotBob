const Discord   = require('discord.js');
const bot       = new Discord.Client();
const https     = require('https');
const { connect } = require('http2');
const request   = require('request');
const mongoose  = require('mongoose');

const Player	= require('./models/player.js');

var url = "mongodb://localhost:27017/botbob";

isConnected = false;

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
    isConnected = true;
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

setInterval(CheckPlayers, 5000);


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

            case 'points':
                Player.findOne({id: msg.author.id}, function(err, player){
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        if(player){
                            var points = 'points';
                            if(player.points == 1) points = 'point';
                            msg.channel.send(`You have ${player.points} ${points}.`);
                        }else{
                            msg.channel.send("Write !init to add your username to the database");
                        }
                    }
                });
                break;

            case 'gamble':
                Gamble(1, msg);
                break;

            case 'gamble10':
                Gamble(10, msg);
                break;
        
            case 'topsuchtis':
                Player.find(function(err, players){
                    players.sort(function(a,b){
                        if(parseInt(a.points) > parseInt(b.points)) return -1;
                        if(parseInt(a.points) < parseInt(b.points)) return 1;
                        return 0;
                    });

                    var fields = [];

                    var i = 1;

                    players.forEach(player => {
                        if(i < 6){
                            field = {'name': i + '. ' + player.name, 'value': player.points};
                            fields.push(field);
                        }
                        i++;
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

var channels = process.env.CHANNELS.split(' ');

function CheckPlayers(){
    if(isConnected){
        channels.forEach(channelId => {
            var channel = bot.channels.fetch(channelId);

            Promise.resolve(channel).then(function(value){
                members = value.members;
                members.forEach(member => {
                    Player.findOne({id: member['id']}, function(err, foundPlayer){
                        if(err){
                            console.log(err);
                            return;
                        }else{
                            if(foundPlayer){
                                foundPlayer.points = foundPlayer.points + 1;
                                foundPlayer.save();
                            }
                        }
                    });
                });
            });
        });
    }
}


function Gamble(times, msg){
    Player.findOne({id: msg.author.id}, function(err, player){
        if(err){
            console.log(err);
            return;
        }else{
            if(player){
                if(player.points == 0){
                    msg.channel.send("You do not have any points at the moment :((. You have to play more!");
                    return;
                }
                var newPoints = [];
                var pointsBefore = player.points;

                var weights = [0, 2];
                var rnd = Math.floor(Math.random() * weights.length);

                var answer = '';

                newPoints.push(Math.floor(pointsBefore * weights[rnd]));
                answer += newPoints[newPoints.length - 1] + ', ';

                for (let i = 1; i < times; i++) {
                    var rnd = Math.floor(Math.random() * weights.length);
                    newPoints.push(Math.floor(newPoints[newPoints.length - 1] * weights[rnd]));
                    answer += newPoints[newPoints.length - 1]+ ', ';
                }


                player.points = newPoints[newPoints.length - 1];
                player.save();
                answer = answer.slice(0, answer.length - 2);
                var point = 'points';
                if(pointsBefore === 1) point = 'point';
                msg.channel.send(`You had **${pointsBefore}** ${point}. Now you have **${answer}**. gg`);
            }else{
                Init(msg);
                msg.channel.send("Uups, I had to register you first. You do not have any points yet.")
            }
        }
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
