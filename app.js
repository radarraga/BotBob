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
 
// // Create the encoder.
// // Specify 48kHz sampling rate and 2 channel size.
// const encoder = new OpusEncoder(48000, 2);
 
// // Encode and decode.
// const encoded = encoder.encode(buffer, 48000 / 100);
// const decoded = encoder.decode(encoded, 48000 / 100);


bot.on('message', msg => {
    if(!msg.content.startsWith('!')) return;
    var message = msg.content.substring(1);
    switch (message) {
        case 'gay':
            var user = msg.guild.members.random();
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

    
        default:
            var embed = new Discord.MessageEmbed()
                .setColor('#222222')
                .setTitle('Verkackt')
                .addField(
                    "Ich hab verkackt", "Ah, ich hab' verkackt, mir ist egal \n Sollen die alle schwanger werden, Bruder, ich bezahl' \n" + 
                    "Und ja, was soll ich sagen? Hab' schon tausend mal verkackt \n  Sag' ihnen, ich werde mich ändern und die kaufen mir das ab, Gzuz", false
                )
            msg.channel.send(embed);

            var channel = msg.member.voice.channel;

            channel.join().then(connection => {
                const dispatcher = connection.play('./Audio/Verkackt.mp3');
                dispatcher.on("end", end =>
                {
                    channel.leave();
                });
            }).catch(err => console.log(err));
            break;
    }
});