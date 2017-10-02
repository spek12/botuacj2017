require('dotenv-extended').load();


//Librerias
var builder = require('botbuilder');
var restify = require('restify');
const cognitiveservices = require('botbuilder-cognitiveservices');


//crear connector de chat, msg, skype, etc
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//Creo el bot
var bot = new builder.UniversalBot(connector);

// Crearmos el servidor
var server =restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listen to %s', server.name, server.url);

});
server.post('/api/messages', connector.listen());

//Conexion de LUIS
const qnarecognizer = new cognitiveservices.QnAMakerRecognizer({ knowledgeBaseId: '408b01d6-96c3-4a63-875d-19a02cf2f7c5', subscriptionKey: '48243fa8da7e44b8aeddcb4b502dc246' });
const recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/94b2f2a5-2c10-4a7b-bac5-91b457162267?subscription-key=1b32aced334346dcb4d40613fac774fe&verbose=true&timezoneOffset=-420&q=');
var intents = new builder.IntentDialog({ recognizers: [ qnarecognizer, recognizer] });

//Creamos raiz de dialogo con LUIS
bot.dialog('/', intents) 
.endConversationAction(
    "endPizza", "Ok. Gracias por utilizar este bot.",
    {
        matches: /^-goodbye$|^adios$|^bye$/i,
        confirmPrompt: "Esto terminara la conversacion. Estas seguro?"
    }
)


//Dialogo de ayuda
bot.dialog('help', function (session, args, next) {
    session.endDialog("Este bot te ayudara a resolver dudas presentes en la Pagina de la UACJ, asi como del tablero de la UACJ.");
})
.triggerAction({
    matches: /^-help$/i,
});

//Dialogo de saluar con LUIS
intents.matches('Saludar', [
    function (session) {
    session.send('Hola, Bienvenido a ConsultasBOTUACJ, donde te ayudare a resolver dudas que presentes.');
    session.beginDialog('nombre');
    },
    function (session, results) {
        session.dialogData.nombre = results.response;
        session.send("Gracias %s, Con cual duda te puedo ayudar hoy?",session.dialogData.nombre );
        session.endDialog();
    
    }
    
]);

//Dialogo de como estas bot con LUIS
intents.matches('Estado', function (session) {
    session.send("Me siento estupendamente. Me encanta resolver dudas. ¿Tiene alguna pregunta para mí?");
});

//Dialogo por default
intents.onDefault(builder.DialogAction.send('No he entendido lo que quieres decir, prueba de nuevo'));

//Dialogo de nombre
bot.dialog('nombre', [
    function (session) {
        builder.Prompts.text(session, "Cual es tu nombre?.");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

//Dialogo de creacion de bot con LUIS
intents.matches('Creadores', function (session) {
    session.send("Gracias por preguntar, mis creadores son: Angel Aniel Santana Payan y Armando Najera Benavidez");
});

//Dialogo de cardex
intents.matches('Tablero', function (session) {
    session.send("Entra a la pagina de Conecta UACJ y una vez que hayas seleccionado Campus Virtual, ubica en la sección Sitios tu instituto, haz clic sobre tu Instituto");
               var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/png",
                contentUrl: "http://i68.tinypic.com/n4xo1s.png",
            }]);
              session.endDialog(msg);
    
});

//Dialogo de nuevo ingreso 
intents.matches('Gracias', function (session) {
    session.send("Es un gusto poder ayudarte. Me alegro que haya sido de gran utilidad");
});

intents.matches('qna', [
    function (session, args, next) {
        var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
        session.send(answerEntity.entity);
    }
]);
