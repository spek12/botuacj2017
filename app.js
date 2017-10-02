require('dotenv-extended').load();


//Librerias
const restify = require('restify'),
    builder = require('botbuilder'),
    cognitiveservices = require('botbuilder-cognitiveservices'),
    luisRecognizer = new builder.LuisRecognizer('LUIS_URL'),
    intents = new builder.IntentDialog({ recognizers: [luisRecognizer] }),
    recognizer = new cognitiveservices.QnAMakerRecognizer({ knowledgeBaseId: 'KB_ID', subscriptionKey: 'YOUR_SUBSCRIPTION_KEY' });
 
//Configure server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
 
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
 
let bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
 
//intents
intents.matches('EstadoPedido', (session, args, next) => {
    session.endDialog('EstadoPedido intent');
});
 
intents.onDefault((session, args) => {
    session.endDialog('Lo siento, no te he entendido :(');
});
 
const QnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match!',
    qnaThreshold: 0.3
});
 
QnAMakerDialog.invokeAnswer = (session, qnaMakerResult, threshold, noMatchMessage) => {
    if (qnaMakerResult.score >= threshold) {
        console.log('QnAMaker responds');
        session.endDialog(qnaMakerResult.answer);
    }
    else {
        console.log('LUIS responds');
        session.beginDialog('/fallbackLUIS');
    }
};
 
bot.dialog('/', QnAMakerDialog);
bot.dialog('/fallbackLUIS', intents);
