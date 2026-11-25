-- Past-tense practice: imperfectum + past participle forms for every verb
-- in the deck, plus two new quiz directions (Dutch verb -> Dutch form).
-- Forms are curated here because the markdown source has no tense data.
-- Re-seeding (data/seed-words-*.sql, ON CONFLICT DO NOTHING) never touches
-- these columns. NEW verbs added later get empty arrays and are simply
-- excluded from these modes until a follow-up UPDATE migration.

ALTER TABLE public.words
  ADD COLUMN dutch_past_forms        TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN dutch_participle_forms  TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.words SET dutch_past_forms=ARRAY['had','hadden'], dutch_participle_forms=ARRAY['gehad'] WHERE lower(dutch)='hebben';
UPDATE public.words SET dutch_past_forms=ARRAY['ging','gingen'], dutch_participle_forms=ARRAY['gegaan'] WHERE lower(dutch)='gaan';
UPDATE public.words SET dutch_past_forms=ARRAY['maakte','maakten'], dutch_participle_forms=ARRAY['gemaakt'] WHERE lower(dutch)='maken';
UPDATE public.words SET dutch_past_forms=ARRAY['deed','deden'], dutch_participle_forms=ARRAY['gedaan'] WHERE lower(dutch)='doen';
UPDATE public.words SET dutch_past_forms=ARRAY['liet','lieten'], dutch_participle_forms=ARRAY['gelaten'] WHERE lower(dutch)='laten';
UPDATE public.words SET dutch_past_forms=ARRAY['dacht','dachten'], dutch_participle_forms=ARRAY['gedacht'] WHERE lower(dutch)='denken';
UPDATE public.words SET dutch_past_forms=ARRAY['gaf','gaven'], dutch_participle_forms=ARRAY['gegeven'] WHERE lower(dutch)='geven';
UPDATE public.words SET dutch_past_forms=ARRAY['hield','hielden'], dutch_participle_forms=ARRAY['gehouden'] WHERE lower(dutch)='houden';
UPDATE public.words SET dutch_past_forms=ARRAY['zat','zaten'], dutch_participle_forms=ARRAY['gezeten'] WHERE lower(dutch)='zitten';
UPDATE public.words SET dutch_past_forms=ARRAY['begon','begonnen'], dutch_participle_forms=ARRAY['begonnen'] WHERE lower(dutch)='beginnen';
UPDATE public.words SET dutch_past_forms=ARRAY['hoorde','hoorden'], dutch_participle_forms=ARRAY['gehoord'] WHERE lower(dutch)='horen';
UPDATE public.words SET dutch_past_forms=ARRAY['voelde','voelden'], dutch_participle_forms=ARRAY['gevoeld'] WHERE lower(dutch)='voelen';
UPDATE public.words SET dutch_past_forms=ARRAY['viel','vielen'], dutch_participle_forms=ARRAY['gevallen'] WHERE lower(dutch)='vallen';
UPDATE public.words SET dutch_past_forms=ARRAY['sprak','spraken'], dutch_participle_forms=ARRAY['gesproken'] WHERE lower(dutch)='spreken';
UPDATE public.words SET dutch_past_forms=ARRAY['vertelde','vertelden'], dutch_participle_forms=ARRAY['verteld'] WHERE lower(dutch)='vertellen';
UPDATE public.words SET dutch_past_forms=ARRAY['werkte','werkten'], dutch_participle_forms=ARRAY['gewerkt'] WHERE lower(dutch)='werken';
UPDATE public.words SET dutch_past_forms=ARRAY['wachtte','wachtten'], dutch_participle_forms=ARRAY['gewacht'] WHERE lower(dutch)='wachten';
UPDATE public.words SET dutch_past_forms=ARRAY['leerde','leerden'], dutch_participle_forms=ARRAY['geleerd'] WHERE lower(dutch)='leren';
UPDATE public.words SET dutch_past_forms=ARRAY['lachte','lachten'], dutch_participle_forms=ARRAY['gelachen'] WHERE lower(dutch)='lachen';
UPDATE public.words SET dutch_past_forms=ARRAY['hielp','hielpen'], dutch_participle_forms=ARRAY['geholpen'] WHERE lower(dutch)='helpen';
UPDATE public.words SET dutch_past_forms=ARRAY['sliep','sliepen'], dutch_participle_forms=ARRAY['geslapen'] WHERE lower(dutch)='slapen';
UPDATE public.words SET dutch_past_forms=ARRAY['bedoelde','bedoelden'], dutch_participle_forms=ARRAY['bedoeld'] WHERE lower(dutch)='bedoelen';
UPDATE public.words SET dutch_past_forms=ARRAY['groeide','groeiden'], dutch_participle_forms=ARRAY['gegroeid'] WHERE lower(dutch)='groeien';
UPDATE public.words SET dutch_past_forms=ARRAY['leidde','leidden'], dutch_participle_forms=ARRAY['geleid'] WHERE lower(dutch)='leiden';
UPDATE public.words SET dutch_past_forms=ARRAY['stond','stonden'], dutch_participle_forms=ARRAY['gestaan'] WHERE lower(dutch)='staan';
UPDATE public.words SET dutch_past_forms=ARRAY['leverde','leverden'], dutch_participle_forms=ARRAY['geleverd'] WHERE lower(dutch)='leveren';
UPDATE public.words SET dutch_past_forms=ARRAY['hoopte','hoopten'], dutch_participle_forms=ARRAY['gehoopt'] WHERE lower(dutch)='hopen';
UPDATE public.words SET dutch_past_forms=ARRAY['stapte','stapten'], dutch_participle_forms=ARRAY['gestapt'] WHERE lower(dutch)='stappen';
UPDATE public.words SET dutch_past_forms=ARRAY['opende','openden'], dutch_participle_forms=ARRAY['geopend'] WHERE lower(dutch)='openen';
UPDATE public.words SET dutch_past_forms=ARRAY['zong','zongen'], dutch_participle_forms=ARRAY['gezongen'] WHERE lower(dutch)='zingen';
UPDATE public.words SET dutch_past_forms=ARRAY['vloog','vlogen'], dutch_participle_forms=ARRAY['gevlogen'] WHERE lower(dutch)='vliegen';
UPDATE public.words SET dutch_past_forms=ARRAY['miste','misten'], dutch_participle_forms=ARRAY['gemist'] WHERE lower(dutch)='missen';
UPDATE public.words SET dutch_past_forms=ARRAY['wenste','wensten'], dutch_participle_forms=ARRAY['gewenst'] WHERE lower(dutch)='wensen';
UPDATE public.words SET dutch_past_forms=ARRAY['kostte','kostten'], dutch_participle_forms=ARRAY['gekost'] WHERE lower(dutch)='kosten';
UPDATE public.words SET dutch_past_forms=ARRAY['ontbrak','ontbraken'], dutch_participle_forms=ARRAY['ontbroken'] WHERE lower(dutch)='ontbreken';
UPDATE public.words SET dutch_past_forms=ARRAY['rende','renden'], dutch_participle_forms=ARRAY['gerend'] WHERE lower(dutch)='rennen';
UPDATE public.words SET dutch_past_forms=ARRAY['won','wonnen'], dutch_participle_forms=ARRAY['gewonnen'] WHERE lower(dutch)='winnen';
UPDATE public.words SET dutch_past_forms=ARRAY['vulde','vulden'], dutch_participle_forms=ARRAY['gevuld'] WHERE lower(dutch)='vullen';
UPDATE public.words SET dutch_past_forms=ARRAY['vervulde','vervulden'], dutch_participle_forms=ARRAY['vervuld'] WHERE lower(dutch)='vervullen';
UPDATE public.words SET dutch_past_forms=ARRAY['plaatste','plaatsten'], dutch_participle_forms=ARRAY['geplaatst'] WHERE lower(dutch)='plaatsen';
UPDATE public.words SET dutch_past_forms=ARRAY['besprak','bespraken'], dutch_participle_forms=ARRAY['besproken'] WHERE lower(dutch)='bespreken';
UPDATE public.words SET dutch_past_forms=ARRAY['danste','dansten'], dutch_participle_forms=ARRAY['gedanst'] WHERE lower(dutch)='dansen';
UPDATE public.words SET dutch_past_forms=ARRAY['droomde','droomden'], dutch_participle_forms=ARRAY['gedroomd'] WHERE lower(dutch)='dromen';
UPDATE public.words SET dutch_past_forms=ARRAY['vocht','vochten'], dutch_participle_forms=ARRAY['gevochten'] WHERE lower(dutch)='vechten';
UPDATE public.words SET dutch_past_forms=ARRAY['beïnvloedde','beïnvloedden'], dutch_participle_forms=ARRAY['beïnvloed'] WHERE lower(dutch)='beïnvloeden';
UPDATE public.words SET dutch_past_forms=ARRAY['rustte','rustten'], dutch_participle_forms=ARRAY['gerust'] WHERE lower(dutch)='rusten';
UPDATE public.words SET dutch_past_forms=ARRAY['realiseerde','realiseerden'], dutch_participle_forms=ARRAY['gerealiseerd'] WHERE lower(dutch)='realiseren';
UPDATE public.words SET dutch_past_forms=ARRAY['produceerde','produceerden'], dutch_participle_forms=ARRAY['geproduceerd'] WHERE lower(dutch)='produceren';
UPDATE public.words SET dutch_past_forms=ARRAY['waste','wasten'], dutch_participle_forms=ARRAY['gewassen'] WHERE lower(dutch)='wassen';
UPDATE public.words SET dutch_past_forms=ARRAY['dankte','dankten'], dutch_participle_forms=ARRAY['gedankt'] WHERE lower(dutch)='danken';
UPDATE public.words SET dutch_past_forms=ARRAY['interesseerde','interesseerden'], dutch_participle_forms=ARRAY['geïnteresseerd'] WHERE lower(dutch)='interesseren';
UPDATE public.words SET dutch_past_forms=ARRAY['klom','klommen'], dutch_participle_forms=ARRAY['geklommen'] WHERE lower(dutch)='klimmen';
UPDATE public.words SET dutch_past_forms=ARRAY['eindigde','eindigden'], dutch_participle_forms=ARRAY['geëindigd'] WHERE lower(dutch)='eindigen';
UPDATE public.words SET dutch_past_forms=ARRAY['formuleerde','formuleerden'], dutch_participle_forms=ARRAY['geformuleerd'] WHERE lower(dutch)='formuleren';
UPDATE public.words SET dutch_past_forms=ARRAY['publiceerde','publiceerden'], dutch_participle_forms=ARRAY['gepubliceerd'] WHERE lower(dutch)='publiceren';
UPDATE public.words SET dutch_past_forms=ARRAY['organiseerde','organiseerden'], dutch_participle_forms=ARRAY['georganiseerd'] WHERE lower(dutch)='organiseren';
UPDATE public.words SET dutch_past_forms=ARRAY['studeerde','studeerden'], dutch_participle_forms=ARRAY['gestudeerd'] WHERE lower(dutch)='studeren';
UPDATE public.words SET dutch_past_forms=ARRAY['passeerde','passeerden'], dutch_participle_forms=ARRAY['gepasseerd'] WHERE lower(dutch)='passeren';
UPDATE public.words SET dutch_past_forms=ARRAY['vluchtte','vluchtten'], dutch_participle_forms=ARRAY['gevlucht'] WHERE lower(dutch)='vluchten';
UPDATE public.words SET dutch_past_forms=ARRAY['beet','beten'], dutch_participle_forms=ARRAY['gebeten'] WHERE lower(dutch)='bijten';
UPDATE public.words SET dutch_past_forms=ARRAY['accepteerde','accepteerden'], dutch_participle_forms=ARRAY['geaccepteerd'] WHERE lower(dutch)='accepteren';
UPDATE public.words SET dutch_past_forms=ARRAY['verspreidde','verspreidden'], dutch_participle_forms=ARRAY['verspreid'] WHERE lower(dutch)='verspreiden';
UPDATE public.words SET dutch_past_forms=ARRAY['verbood','verboden'], dutch_participle_forms=ARRAY['verboden'] WHERE lower(dutch)='verbieden';
UPDATE public.words SET dutch_past_forms=ARRAY['zond','zonden'], dutch_participle_forms=ARRAY['gezonden'] WHERE lower(dutch)='zenden';
UPDATE public.words SET dutch_past_forms=ARRAY['was','waren'], dutch_participle_forms=ARRAY['geweest'] WHERE lower(dutch)='zijn';
UPDATE public.words SET dutch_past_forms=ARRAY['strekte','strekten'], dutch_participle_forms=ARRAY['gestrekt'] WHERE lower(dutch)='strekken';
UPDATE public.words SET dutch_past_forms=ARRAY['stuurde','stuurden'], dutch_participle_forms=ARRAY['gestuurd'] WHERE lower(dutch)='sturen';
UPDATE public.words SET dutch_past_forms=ARRAY['belde','belden'], dutch_participle_forms=ARRAY['gebeld'] WHERE lower(dutch)='bellen';
UPDATE public.words SET dutch_past_forms=ARRAY['bevatte','bevatten'], dutch_participle_forms=ARRAY['bevat'] WHERE lower(dutch)='bevatten';
UPDATE public.words SET dutch_past_forms=ARRAY['steeg','stegen'], dutch_participle_forms=ARRAY['gestegen'] WHERE lower(dutch)='stijgen';
UPDATE public.words SET dutch_past_forms=ARRAY['herhaalde','herhaalden'], dutch_participle_forms=ARRAY['herhaald'] WHERE lower(dutch)='herhalen';
UPDATE public.words SET dutch_past_forms=ARRAY['kreeg','kregen'], dutch_participle_forms=ARRAY['gekregen'] WHERE lower(dutch)='krijgen';
UPDATE public.words SET dutch_past_forms=ARRAY['liep','liepen'], dutch_participle_forms=ARRAY['gelopen'] WHERE lower(dutch)='lopen';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam','kwamen'], dutch_participle_forms=ARRAY['gekomen'] WHERE lower(dutch)='komen';
UPDATE public.words SET dutch_past_forms=ARRAY['werd','werden'], dutch_participle_forms=ARRAY['geworden'] WHERE lower(dutch)='worden';
UPDATE public.words SET dutch_past_forms=ARRAY['leefde','leefden'], dutch_participle_forms=ARRAY['geleefd'] WHERE lower(dutch)='leven';
UPDATE public.words SET dutch_past_forms=ARRAY['zei','zeiden'], dutch_participle_forms=ARRAY['gezegd'] WHERE lower(dutch)='zeggen';
UPDATE public.words SET dutch_past_forms=ARRAY['wist','wisten'], dutch_participle_forms=ARRAY['geweten'] WHERE lower(dutch)='weten';
UPDATE public.words SET dutch_past_forms=ARRAY['wilde','wilden','wou','wouden'], dutch_participle_forms=ARRAY['gewild'] WHERE lower(dutch)='willen';
UPDATE public.words SET dutch_past_forms=ARRAY['praatte','praatten'], dutch_participle_forms=ARRAY['gepraat'] WHERE lower(dutch)='praten';
UPDATE public.words SET dutch_past_forms=ARRAY['luisterde','luisterden'], dutch_participle_forms=ARRAY['geluisterd'] WHERE lower(dutch)='luisteren';
UPDATE public.words SET dutch_past_forms=ARRAY['zag','zagen'], dutch_participle_forms=ARRAY['gezien'] WHERE lower(dutch)='zien';
UPDATE public.words SET dutch_past_forms=ARRAY['bleef','bleven'], dutch_participle_forms=ARRAY['gebleven'] WHERE lower(dutch)='blijven';
UPDATE public.words SET dutch_past_forms=ARRAY['at','aten'], dutch_participle_forms=ARRAY['gegeten'] WHERE lower(dutch)='eten';
UPDATE public.words SET dutch_past_forms=ARRAY['vroeg','vroegen'], dutch_participle_forms=ARRAY['gevraagd'] WHERE lower(dutch)='vragen';
UPDATE public.words SET dutch_past_forms=ARRAY['nam','namen'], dutch_participle_forms=ARRAY['genomen'] WHERE lower(dutch)='nemen';
UPDATE public.words SET dutch_past_forms=ARRAY['kende','kenden'], dutch_participle_forms=ARRAY['gekend'] WHERE lower(dutch)='kennen';
UPDATE public.words SET dutch_past_forms=ARRAY['stopte','stopten'], dutch_participle_forms=ARRAY['gestopt'] WHERE lower(dutch)='stoppen';
UPDATE public.words SET dutch_past_forms=ARRAY['pakte','pakten'], dutch_participle_forms=ARRAY['gepakt'] WHERE lower(dutch)='pakken';
UPDATE public.words SET dutch_past_forms=ARRAY['zette','zetten'], dutch_participle_forms=ARRAY['gezet'] WHERE lower(dutch)='zetten';
UPDATE public.words SET dutch_past_forms=ARRAY['zocht','zochten'], dutch_participle_forms=ARRAY['gezocht'] WHERE lower(dutch)='zoeken';
UPDATE public.words SET dutch_past_forms=ARRAY['speelde','speelden'], dutch_participle_forms=ARRAY['gespeeld'] WHERE lower(dutch)='spelen';
UPDATE public.words SET dutch_past_forms=ARRAY['bracht','brachten'], dutch_participle_forms=ARRAY['gebracht'] WHERE lower(dutch)='brengen';
UPDATE public.words SET dutch_past_forms=ARRAY['vond','vonden'], dutch_participle_forms=ARRAY['gevonden'] WHERE lower(dutch)='vinden';
UPDATE public.words SET dutch_past_forms=ARRAY['vergat','vergaten'], dutch_participle_forms=ARRAY['vergeten'] WHERE lower(dutch)='vergeten';
UPDATE public.words SET dutch_past_forms=ARRAY['betekende','betekenden'], dutch_participle_forms=ARRAY['betekend'] WHERE lower(dutch)='betekenen';
UPDATE public.words SET dutch_past_forms=ARRAY['gebruikte','gebruikten'], dutch_participle_forms=ARRAY['gebruikt'] WHERE lower(dutch)='gebruiken';
UPDATE public.words SET dutch_past_forms=ARRAY['zorgde','zorgden'], dutch_participle_forms=ARRAY['gezorgd'] WHERE lower(dutch)='zorgen';
UPDATE public.words SET dutch_past_forms=ARRAY['hoefde','hoeften'], dutch_participle_forms=ARRAY['gehoeven'] WHERE lower(dutch)='hoeven';
UPDATE public.words SET dutch_past_forms=ARRAY['dronk','dronken'], dutch_participle_forms=ARRAY['gedronken'] WHERE lower(dutch)='drinken';
UPDATE public.words SET dutch_past_forms=ARRAY['lag','lagen'], dutch_participle_forms=ARRAY['gelegen'] WHERE lower(dutch)='liggen';
UPDATE public.words SET dutch_past_forms=ARRAY['mocht','mochten'], dutch_participle_forms=ARRAY['gemogen'] WHERE lower(dutch)='mogen';
UPDATE public.words SET dutch_past_forms=ARRAY['betaalde','betaalden'], dutch_participle_forms=ARRAY['betaald'] WHERE lower(dutch)='betalen';
UPDATE public.words SET dutch_past_forms=ARRAY['reed','reden'], dutch_participle_forms=ARRAY['gereden'] WHERE lower(dutch)='rijden';
UPDATE public.words SET dutch_past_forms=ARRAY['ontmoette','ontmoetten'], dutch_participle_forms=ARRAY['ontmoet'] WHERE lower(dutch)='ontmoeten';
UPDATE public.words SET dutch_past_forms=ARRAY['trouwde','trouwden'], dutch_participle_forms=ARRAY['getrouwd'] WHERE lower(dutch)='trouwen';
UPDATE public.words SET dutch_past_forms=ARRAY['verloor','verloren'], dutch_participle_forms=ARRAY['verloren'] WHERE lower(dutch)='verliezen';
UPDATE public.words SET dutch_past_forms=ARRAY['veranderde','veranderden'], dutch_participle_forms=ARRAY['veranderd'] WHERE lower(dutch)='veranderen';
UPDATE public.words SET dutch_past_forms=ARRAY['antwoordde','antwoordden'], dutch_participle_forms=ARRAY['geantwoord'] WHERE lower(dutch)='antwoorden';
UPDATE public.words SET dutch_past_forms=ARRAY['kocht','kochten'], dutch_participle_forms=ARRAY['gekocht'] WHERE lower(dutch)='kopen';
UPDATE public.words SET dutch_past_forms=ARRAY['vertrok','vertrokken'], dutch_participle_forms=ARRAY['vertrokken'] WHERE lower(dutch)='vertrekken';
UPDATE public.words SET dutch_past_forms=ARRAY['las','lazen'], dutch_participle_forms=ARRAY['gelezen'] WHERE lower(dutch)='lezen';
UPDATE public.words SET dutch_past_forms=ARRAY['schreef','schreven'], dutch_participle_forms=ARRAY['geschreven'] WHERE lower(dutch)='schrijven';
UPDATE public.words SET dutch_past_forms=ARRAY['duurde','duurden'], dutch_participle_forms=ARRAY['geduurd'] WHERE lower(dutch)='duren';
UPDATE public.words SET dutch_past_forms=ARRAY['bewoog','bewogen'], dutch_participle_forms=ARRAY['bewogen'] WHERE lower(dutch)='bewegen';
UPDATE public.words SET dutch_past_forms=ARRAY['keek','keken'], dutch_participle_forms=ARRAY['gekeken'] WHERE lower(dutch)='kijken';
UPDATE public.words SET dutch_past_forms=ARRAY['sloot','sloten'], dutch_participle_forms=ARRAY['gesloten'] WHERE lower(dutch)='sluiten';
UPDATE public.words SET dutch_past_forms=ARRAY['lukte','lukten'], dutch_participle_forms=ARRAY['gelukt'] WHERE lower(dutch)='lukken';
UPDATE public.words SET dutch_past_forms=ARRAY['koos','kozen'], dutch_participle_forms=ARRAY['gekozen'] WHERE lower(dutch)='kiezen';
UPDATE public.words SET dutch_past_forms=ARRAY['verkocht','verkochten'], dutch_participle_forms=ARRAY['verkocht'] WHERE lower(dutch)='verkopen';
UPDATE public.words SET dutch_past_forms=ARRAY['verdiende','verdienden'], dutch_participle_forms=ARRAY['verdiend'] WHERE lower(dutch)='verdienen';
UPDATE public.words SET dutch_past_forms=ARRAY['vierde','vierden'], dutch_participle_forms=ARRAY['gevierd'] WHERE lower(dutch)='vieren';
UPDATE public.words SET dutch_past_forms=ARRAY['besloot','besloten'], dutch_participle_forms=ARRAY['besloten'] WHERE lower(dutch)='besluiten';
UPDATE public.words SET dutch_past_forms=ARRAY['rook','roken'], dutch_participle_forms=ARRAY['geroken'] WHERE lower(dutch)='ruiken';
UPDATE public.words SET dutch_past_forms=ARRAY['leende','leenden'], dutch_participle_forms=ARRAY['geleend'] WHERE lower(dutch)='lenen';
UPDATE public.words SET dutch_past_forms=ARRAY['reisde','reisden'], dutch_participle_forms=ARRAY['gereisd'] WHERE lower(dutch)='reizen';
UPDATE public.words SET dutch_past_forms=ARRAY['nam mee','namen mee'], dutch_participle_forms=ARRAY['meegenomen'] WHERE lower(dutch)='meenemen';
UPDATE public.words SET dutch_past_forms=ARRAY['werkte samen','werkten samen'], dutch_participle_forms=ARRAY['samengewerkt'] WHERE lower(dutch)='samenwerken';
UPDATE public.words SET dutch_past_forms=ARRAY['ging weg','gingen weg'], dutch_participle_forms=ARRAY['weggegaan'] WHERE lower(dutch)='weggaan';
UPDATE public.words SET dutch_past_forms=ARRAY['legde uit','legden uit'], dutch_participle_forms=ARRAY['uitgelegd'] WHERE lower(dutch)='uitleggen';
UPDATE public.words SET dutch_past_forms=ARRAY['ging door','gingen door'], dutch_participle_forms=ARRAY['doorgegaan'] WHERE lower(dutch)='doorgaan';
UPDATE public.words SET dutch_past_forms=ARRAY['stond op','stonden op'], dutch_participle_forms=ARRAY['opgestaan'] WHERE lower(dutch)='opstaan';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam terug','kwamen terug'], dutch_participle_forms=ARRAY['teruggekomen'] WHERE lower(dutch)='terugkomen';
UPDATE public.words SET dutch_past_forms=ARRAY['haalde op','haalden op'], dutch_participle_forms=ARRAY['opgehaald'] WHERE lower(dutch)='ophalen';
UPDATE public.words SET dutch_past_forms=ARRAY['loste op','losten op'], dutch_participle_forms=ARRAY['opgelost'] WHERE lower(dutch)='oplossen';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam binnen','kwamen binnen'], dutch_participle_forms=ARRAY['binnengekomen'] WHERE lower(dutch)='binnenkomen';
UPDATE public.words SET dutch_past_forms=ARRAY['sprak af','spraken af'], dutch_participle_forms=ARRAY['afgesproken'] WHERE lower(dutch)='afspreken';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam aan','kwamen aan'], dutch_participle_forms=ARRAY['aangekomen'] WHERE lower(dutch)='aankomen';
UPDATE public.words SET dutch_past_forms=ARRAY['ging uit','gingen uit'], dutch_participle_forms=ARRAY['uitgegaan'] WHERE lower(dutch)='uitgaan';
UPDATE public.words SET dutch_past_forms=ARRAY['bood aan','boden aan'], dutch_participle_forms=ARRAY['aangeboden'] WHERE lower(dutch)='aanbieden';
UPDATE public.words SET dutch_past_forms=ARRAY['ging binnen','gingen binnen'], dutch_participle_forms=ARRAY['binnengegaan'] WHERE lower(dutch)='binnengaan';
UPDATE public.words SET dutch_past_forms=ARRAY['belde op','belden op'], dutch_participle_forms=ARRAY['opgebeld'] WHERE lower(dutch)='opbellen';
UPDATE public.words SET dutch_past_forms=ARRAY['maakte schoon','maakten schoon'], dutch_participle_forms=ARRAY['schoongemaakt'] WHERE lower(dutch)='schoonmaken';
UPDATE public.words SET dutch_past_forms=ARRAY['deed dicht','deden dicht'], dutch_participle_forms=ARRAY['dichtgedaan'] WHERE lower(dutch)='dichtdoen';
UPDATE public.words SET dutch_past_forms=ARRAY['deed open','deden open'], dutch_participle_forms=ARRAY['opengedaan'] WHERE lower(dutch)='opendoen';
UPDATE public.words SET dutch_past_forms=ARRAY['woonde samen','woonden samen'], dutch_participle_forms=ARRAY['samengewoond'] WHERE lower(dutch)='samenwonen';
UPDATE public.words SET dutch_past_forms=ARRAY['leverde in','leverden in'], dutch_participle_forms=ARRAY['ingeleverd'] WHERE lower(dutch)='inleveren';
UPDATE public.words SET dutch_past_forms=ARRAY['waste af','wasten af'], dutch_participle_forms=ARRAY['afgewassen'] WHERE lower(dutch)='afwassen';
UPDATE public.words SET dutch_past_forms=ARRAY['gooide weg','gooiden weg'], dutch_participle_forms=ARRAY['weggegooid'] WHERE lower(dutch)='weggooien';
UPDATE public.words SET dutch_past_forms=ARRAY['stapte in','stapten in'], dutch_participle_forms=ARRAY['ingestapt'] WHERE lower(dutch)='instappen';
UPDATE public.words SET dutch_past_forms=ARRAY['stapte uit','stapten uit'], dutch_participle_forms=ARRAY['uitgestapt'] WHERE lower(dutch)='uitstappen';
UPDATE public.words SET dutch_past_forms=ARRAY['bracht weg','brachten weg'], dutch_participle_forms=ARRAY['weggebracht'] WHERE lower(dutch)='wegbrengen';
UPDATE public.words SET dutch_past_forms=ARRAY['stak over','staken over'], dutch_participle_forms=ARRAY['overgestoken'] WHERE lower(dutch)='oversteken';
UPDATE public.words SET dutch_past_forms=ARRAY['ging af','gingen af'], dutch_participle_forms=ARRAY['afgegaan'] WHERE lower(dutch)='afgaan';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam tegen','kwamen tegen'], dutch_participle_forms=ARRAY['tegengekomen'] WHERE lower(dutch)='tegenkomen';
UPDATE public.words SET dutch_past_forms=ARRAY['ging verder','gingen verder'], dutch_participle_forms=ARRAY['verdergegaan'] WHERE lower(dutch)='verdergaan';
UPDATE public.words SET dutch_past_forms=ARRAY['rekende af','rekenden af'], dutch_participle_forms=ARRAY['afgerekend'] WHERE lower(dutch)='afrekenen';
UPDATE public.words SET dutch_past_forms=ARRAY['maakte af','maakten af'], dutch_participle_forms=ARRAY['afgemaakt'] WHERE lower(dutch)='afmaken';
UPDATE public.words SET dutch_past_forms=ARRAY['studeerde af','studeerden af'], dutch_participle_forms=ARRAY['afgestudeerd'] WHERE lower(dutch)='afstuderen';
UPDATE public.words SET dutch_past_forms=ARRAY['gaf door','gaven door'], dutch_participle_forms=ARRAY['doorgegeven'] WHERE lower(dutch)='doorgeven';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam langs','kwamen langs'], dutch_participle_forms=ARRAY['langsgekomen'] WHERE lower(dutch)='langskomen';
UPDATE public.words SET dutch_past_forms=ARRAY['bracht mee','brachten mee'], dutch_participle_forms=ARRAY['meegebracht'] WHERE lower(dutch)='meebrengen';
UPDATE public.words SET dutch_past_forms=ARRAY['deed mee','deden mee'], dutch_participle_forms=ARRAY['meegedaan'] WHERE lower(dutch)='meedoen';
UPDATE public.words SET dutch_past_forms=ARRAY['gaf mee','gaven mee'], dutch_participle_forms=ARRAY['meegegeven'] WHERE lower(dutch)='meegeven';
UPDATE public.words SET dutch_past_forms=ARRAY['kwam mee','kwamen mee'], dutch_participle_forms=ARRAY['meegekomen'] WHERE lower(dutch)='meekomen';
UPDATE public.words SET dutch_past_forms=ARRAY['keek mee','keken mee'], dutch_participle_forms=ARRAY['meegekeken'] WHERE lower(dutch)='meekijken';
UPDATE public.words SET dutch_past_forms=ARRAY['legde neer','legden neer'], dutch_participle_forms=ARRAY['neergelegd'] WHERE lower(dutch)='neerleggen';
UPDATE public.words SET dutch_past_forms=ARRAY['zette neer','zetten neer'], dutch_participle_forms=ARRAY['neergezet'] WHERE lower(dutch)='neerzetten';
UPDATE public.words SET dutch_past_forms=ARRAY['ging om met','gingen om met'], dutch_participle_forms=ARRAY['omgegaan'] WHERE lower(dutch)='omgaan met';
UPDATE public.words SET dutch_past_forms=ARRAY['schreef op','schreven op'], dutch_participle_forms=ARRAY['opgeschreven'] WHERE lower(dutch)='opschrijven';

-- Widen the direction gates (record_attempt itself does no literal validation).
ALTER TABLE public.word_stats DROP CONSTRAINT word_stats_direction_check;
ALTER TABLE public.word_stats ADD CONSTRAINT word_stats_direction_check
  CHECK (direction IN ('nl_en', 'en_nl', 'nl_past', 'nl_participle'));
ALTER TABLE public.attempts DROP CONSTRAINT attempts_direction_check;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_direction_check
  CHECK (direction IN ('nl_en', 'en_nl', 'nl_past', 'nl_participle'));

-- Two noun cards share an infinitive spelling with a verb (life/leven,
-- food/eten); the updates above match on dutch alone, so strip the verb
-- forms back off the nouns.
UPDATE public.words SET dutch_past_forms = '{}', dutch_participle_forms = '{}'
  WHERE lower(english) IN ('life', 'food') AND lower(dutch) IN ('leven', 'eten');
