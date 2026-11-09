(() => {
 const messages = {
  nl: {
   deleteOwn:'Verwijder mijn bijdrage', deleting:'Verwijderen…', deleteConfirm:'Wil je jouw bijdrage verwijderen? Alle tekstreacties en herkenningen bij deze bijdrage worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.', deleteSaved:'Je bijdrage en de bijbehorende reacties zijn verwijderd.', deleteNotAllowed:'Deze bijdrage is niet van deze browser of is al verwijderd.', deleteError:'Verwijderen kon niet worden bevestigd. Ververs de pagina en probeer zo nodig opnieuw.',
   pageTitle:'TM Minorkeuze semester 2: wat horen jullie?', titleLead:'TM Minorkeuze semester 2:', titleQuestion:'wat horen jullie?',
   description:'Deel als leercoach je inzichten over de minorkeuze van TM-studenten.', skip:'Naar het formulier',
   intro:'Meer TM-studenten hebben voor semester 2 gekozen voor een minor buiten Inholland via Kies op Maat. Als leercoach hoor je wat studenten bezighoudt. Deel jouw inzichten, lees de ervaringen van collega’s en vul elkaar aan. Zo krijgen we samen beter zicht op de redenen achter deze keuzes.',
   question:'Waarom denk jij dat meer studenten voor semester 2 kiezen voor een minor buiten Inholland via Kies op Maat?',
   guidance:'Deel wat je van studenten hoort en wat je zelf vermoedt. Geef waar mogelijk een concreet voorbeeld en maak duidelijk of het om een uitspraak van een student of jouw eigen inschatting gaat. Noem geen namen of herkenbare gegevens van studenten.',
   name:'Je naam', required:'(verplicht)', namePlaceholder:'Voor- en achternaam', rememberName:'We onthouden je naam op dit apparaat.', insight:'Jouw inzicht', insightPlaceholder:'Wat hoor je van studenten? Wat valt je op?',
   privacy:'Geen namen of herkenbare gegevens van studenten.', share:'Deel je inzicht', colleagues:'Wat collega’s delen', sort:'Sorteer op', newest:'Nieuwste eerst', mostRecognized:'Meest herkend',
   loadingTotals:'Antwoorden en reacties worden geladen…', loading:'Inzichten laden…', syncing:'Nieuwe bijdragen worden elke 8 seconden opgehaald.', footer:'Samen beter zicht op de keuzes van studenten.',
   reactionGroup:'Reageer met een icoontje', reaction_recognize:'Dit herken ik', reaction_checked:'Mee eens', reaction_sad:'Jammer', reaction_happy:'Mooi', reply:'Reageer', addReply:'Vul je collega aan',
   replyName:'Je naam (verplicht)', replyBody:'Je reactie (verplicht)', replyPlaceholder:'Wat hoor of herken jij? Noem geen studentgegevens.', postReply:'Plaats reactie',
   answerOne:'antwoord', answerMany:'antwoorden', commentOne:'reactie', commentMany:'reacties', empty:'Er zijn nog geen inzichten gedeeld. Deel jij de eerste?',
   addReaction:'Klik om te reageren.', removeReaction:'Klik om jouw reactie in te trekken.', reactionAdded:'Je reactie ‘{reaction}’ is toegevoegd.', reactionRemoved:'Je reactie ‘{reaction}’ is ingetrokken.',
   replySaved:'Je reactie is geplaatst.', insightSaved:'Bedankt! Je inzicht is gedeeld en zichtbaar voor collega’s.', requiredMessage:'Vul je naam en een tekst in. Alleen spaties zijn niet voldoende.', requiredField:'Vul dit veld in.',
   sharing:'Bezig met delen…', saving:'Je bijdrage wordt opgeslagen…', serverError:'De server is niet bereikbaar. Probeer het opnieuw.', saveError:'Opslaan lukt op dit moment niet. Je tekst blijft staan. Probeer opnieuw.',
   timeoutError:'De server reageert niet op tijd. Je tekst blijft staan. Probeer opnieuw.', networkError:'Geen verbinding met de server. Je tekst blijft staan. Probeer opnieuw.', refreshError:'Verversen lukt even niet. De getoonde bijdragen blijven staan; we proberen het automatisch opnieuw.',
   inputError:'Controleer je naam en tekst. Lege bijdragen zijn niet toegestaan.', originError:'Deze herkomst is niet toegestaan. Open de gedeelde website.', notFound:'Dit inzicht is niet gevonden.', tooLong:'Je bericht is te lang. Kort het in en probeer opnieuw.', invalidRequest:'Het bericht kon niet worden gelezen. Probeer opnieuw.', tooMany:'Je verstuurt veel berichten. Wacht een minuut en probeer opnieuw.'
  },
  en: {
   deleteOwn:'Delete my contribution', deleting:'Deleting…', deleteConfirm:'Delete your contribution? All comments and reactions attached to it will also be deleted. This cannot be undone.', deleteSaved:'Your contribution and its comments and reactions have been deleted.', deleteNotAllowed:'This contribution does not belong to this browser or has already been deleted.', deleteError:'Deletion could not be confirmed. Refresh the page and try again if needed.',
   pageTitle:'TM Minor choices, semester 2: what are you hearing?', titleLead:'TM Minor choices, semester 2:', titleQuestion:'what are you hearing?',
   description:'Share your insights as a learning coach on TM students’ minor choices.', skip:'Skip to the form',
   intro:'More TM students have chosen a minor outside Inholland through Kies op Maat for semester 2. As a learning coach, you hear what matters to students. Share your insights, read your colleagues’ experiences and build on each other’s observations. Together, we can better understand the reasons behind these choices.',
   question:'Why do you think more students are choosing a minor outside Inholland through Kies op Maat for semester 2?',
   guidance:'Share what you hear from students and your own impressions. Where possible, give a specific example and make clear whether it is a student’s statement or your own interpretation. Do not include students’ names or identifying details.',
   name:'Your name', required:'(required)', namePlaceholder:'First and last name', rememberName:'We remember your name on this device.', insight:'Your insight', insightPlaceholder:'What are students telling you? What stands out?',
   privacy:'No student names or identifying details.', share:'Share your insight', colleagues:'What colleagues are sharing', sort:'Sort by', newest:'Newest first', mostRecognized:'Most recognised',
   loadingTotals:'Loading insights and comments…', loading:'Loading insights…', syncing:'New contributions are fetched every 8 seconds.', footer:'Together, we gain a better understanding of students’ choices.',
   reactionGroup:'React with an icon', reaction_recognize:'I recognise this', reaction_checked:'I agree', reaction_sad:'That’s a shame', reaction_happy:'Lovely', reply:'Reply', addReply:'Add to your colleague’s insight',
   replyName:'Your name (required)', replyBody:'Your comment (required)', replyPlaceholder:'What do you hear or recognise? Do not include student details.', postReply:'Post comment',
   answerOne:'insight', answerMany:'insights', commentOne:'comment', commentMany:'comments', empty:'No insights have been shared yet. Will you share the first?',
   addReaction:'Click to react.', removeReaction:'Click to withdraw your reaction.', reactionAdded:'Your reaction “{reaction}” has been added.', reactionRemoved:'Your reaction “{reaction}” has been withdrawn.',
   replySaved:'Your comment has been posted.', insightSaved:'Thank you! Your insight has been shared and is visible to colleagues.', requiredMessage:'Enter your name and a message. Spaces alone are not enough.', requiredField:'Please fill out this field.',
   sharing:'Sharing…', saving:'Saving your contribution…', serverError:'The server cannot be reached. Please try again.', saveError:'Saving is temporarily unavailable. Your text is still here. Please try again.',
   timeoutError:'The server took too long to respond. Your text is still here. Please try again.', networkError:'There is no connection to the server. Your text is still here. Please try again.', refreshError:'Updates are temporarily unavailable. Existing contributions are still shown; we will try again automatically.',
   inputError:'Check your name and message. Empty contributions are not allowed.', originError:'This origin is not allowed. Please open the shared website.', notFound:'This insight could not be found.', tooLong:'Your message is too long. Please shorten it and try again.', invalidRequest:'The message could not be read. Please try again.', tooMany:'You are sending many messages. Wait a minute and try again.'
  }
 };
 let language='nl';try{if(localStorage.getItem('tm-language')==='en')language='en';}catch{}
 function t(key,values={}){return (messages[language][key]||messages.nl[key]||key).replace(/\{(\w+)\}/g,(_,k)=>k==='reaction'&&values.kind?t('reaction_'+values.kind):String(values[k]??''));}
 function translate(root=document){
  for(const node of root.querySelectorAll('[data-i18n]'))node.textContent=t(node.dataset.i18n);
  for(const node of root.querySelectorAll('[data-i18n-placeholder]'))node.placeholder=t(node.dataset.i18nPlaceholder);
  for(const node of root.querySelectorAll('[data-i18n-aria]'))node.setAttribute('aria-label',t(node.dataset.i18nAria));
 }
 function apply(){
  document.documentElement.lang=language;document.title=t('pageTitle');
  const description=document.querySelector('meta[name=description]');if(description)description.content=t('description');
  translate();for(const template of document.querySelectorAll('template'))translate(template.content);
  const button=document.querySelector('#language-toggle');if(button){const label=language==='nl'?'Switch to English':'Schakel naar Nederlands';button.title=label;button.setAttribute('aria-label',label);button.querySelector('.language-code').textContent=language==='nl'?'EN':'NL';button.querySelector('.flag-en').hidden=language!=='nl';button.querySelector('.flag-nl').hidden=language==='nl';}
 }
 function setLanguage(value){if(!['nl','en'].includes(value))return;language=value;try{localStorage.setItem('tm-language',value);}catch{}apply();window.dispatchEvent(new Event('tm-language-change'));}
 window.TM_I18N={messages,t,translate,apply,setLanguage,get language(){return language;}};
 apply();document.querySelector('#language-toggle')?.addEventListener('click',()=>setLanguage(language==='nl'?'en':'nl'));
})();
