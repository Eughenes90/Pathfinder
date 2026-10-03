# Percorsi portali — calcolo geometrico, nessuna API a pagamento

Carica un export JSON di portali non catturati (dal plugin IITC, eventualmente
unificato da più CSV con `merge.html`), e ottieni fino a 10 percorsi a piedi
alternativi — tutto calcolato nel browser, senza chiamare nessuna API esterna
a pagamento. Pensato per gestire anche migliaia di portali in un colpo solo.

## Perché niente Google Distance Matrix API

Per un percorso a piedi, la differenza tra distanza in linea d'aria e
distanza reale è piccola — niente sensi unici veicolari a complicare le cose,
tranne dove ci sono barriere fisiche vere (fiumi, ferrovie, aree recintate).
Un fattore di correzione configurabile (default 1.15) copre la maggior parte
dei casi. Il numero esatto, quando serve davvero, lo dà comunque Google Maps
gratuitamente nel momento in cui l'utente apre il link per navigare — non
c'è bisogno di pagarlo in anticipo per ogni possibile coppia di portali.

Questo elimina completamente il bisogno di: chiave API personale, login,
database, cifratura. Meno pezzi, meno cose che possono rompersi, e il limite
di scala sparisce (l'API di Google ha un tetto di 100 punti per richiesta;
qui non c'è).

## Come scala a migliaia di portali

Il confronto a coppie ("questo portale è vicino a quest'altro?") userebbe
naturalmente O(N²) confronti — con 5.000 portali sono 12,5 milioni,
impraticabile. L'app usa invece un **indice spaziale a griglia**: ogni
portale viene assegnato a una cella dimensionata sulla soglia di distanza, e
si confronta solo con i portali nella propria cella e nelle 8 adiacenti.
Questo riporta il costo medio vicino a O(N). Il tempo di calcolo effettivo
viene mostrato a schermo dopo ogni esecuzione.

Un `setTimeout(0)` prima del calcolo lascia respirare l'interfaccia (mostra
lo stato "Calcolo in corso…") prima di eseguire il lavoro sincrono — utile
sui dataset più grandi dove il calcolo può richiedere qualche centinaio di
millisecondi.

## Migliorie aggiunte di recente

- **Massimo portali per percorso** (default 40) **e tempo massimo totale**
  (default 120 minuti, 0 = nessun limite): un cluster viene diviso in più
  percorsi consecutivi (sovrapposti di un punto, per continuità) non appena
  supera il primo dei due limiti. Il numero da solo può ingannare — 40
  portali possono volerci 10 minuti in una zona densa o 3 ore in una rada —
  per questo contano entrambi i vincoli, non solo il conteggio.
- **Rifinitura 2-opt**: dopo l'ordinamento nearest-neighbor, un passaggio
  2-opt (budget 200 ms per cluster) scambia coppie di tratti se accorciano il
  percorso totale, eliminando i "salti indietro" evitabili.
- **Export GPX**: oltre ai link Google Maps, un pulsante scarica il percorso
  selezionato in formato GPX (sia come `<rte>` che `<trk>`, per compatibilità
  con più app). Un avviso compare solo se il percorso supera 500 punti —
  limite pratico di alcuni dispositivi GPS più datati — cosa che con il tetto
  sopra impostato a default non succede quasi mai.
- **Parametri ricordati**: tempo massimo, velocità, fattore di correzione,
  minimo e massimo portali vengono salvati in un cookie di questo browser
  (nessun dato sensibile, nessun server coinvolto) e ripristinati alla
  riapertura. Link "Ripristina valori di default" per tornare ai valori
  originali.
- **Limite sui marker disegnati**: sopra 150 punti, la mappa mostra solo
  inizio e fine invece di un marker numerato per ogni tappa — evita di
  bloccare il browser su percorsi molto grandi (meno rilevante ora che
  c'è il tetto sopra, ma resta come protezione).
- **Fix: coda troppo piccola dopo uno split.** Dividere un cluster per
  conteggio/tempo massimo può lasciare un'ultima parte più piccola del
  "Minimo portali per percorso" impostato. Ora viene fusa nella parte
  precedente invece di restare un percorso sotto il minimo scelto.
- **Fix: nessun controllo se minimo > massimo.** Se "Minimo portali" supera
  "Massimo portali" i due parametri si contraddicono — il calcolo ora si
  ferma con un messaggio chiaro invece di procedere con un risultato
  inconsistente.

## Un limite da conoscere: l'effetto catena

Il clustering per componenti connesse (A vicino a B, B vicino a C → A, B, C
nello stesso gruppo anche se A e C sono lontani) può, in aree molto dense,
concatenare centinaia o migliaia di portali in un unico cluster enorme —
tecnicamente "raggiungibile a piedi" un passo alla volta, ma non un percorso
che una persona farebbe davvero in una giornata. Se noti percorsi
irrealisticamente lunghi:
- riduci "Tempo massimo tra portali" (meno minuti = cluster più piccoli e
  compatti);
- oppure te lo segnalo qui: si può aggiungere un tetto massimo di portali
  per percorso, spezzando un cluster gigante in più percorsi sequenziali di
  dimensione gestibile — non l'ho aggiunto perché non l'hai richiesto, ma è
  una modifica piccola se ti serve.

## Struttura

- `index.html` — **landing page**: spiega cosa fa il tool e come funziona,
  nessun upload né calcolo. È la pagina che si apre per prima su Vercel.
- `app.html` — il tool vero e proprio (upload, calcolo, mappa, link Google
  Maps). Ci si arriva dal pulsante "Apri il tool" sulla homepage.
- `merge.html` — unisce più export CSV in un unico JSON/CSV senza duplicati,
  tutto lato client.
- `plugin.html` — pagina di download del plugin IITC (`downloads/export-uncaptured-portals.user.js`)
  con istruzioni d'installazione passo per passo.
- `downloads/export-uncaptured-portals.user.js` — lo script IITC stesso,
  servito come file statico: legge i portali già caricati sulla mappa Intel,
  tiene solo quelli non catturati, esporta un JSON nel formato che `app.html`
  si aspetta in caricamento. Gira solo nel browser di chi lo installa, non
  tocca questo backend.
- `api/config.js` — espone solo `CARTO_API_KEY` (opzionale, solo per la
  mappa con le strade nell'anteprima — vedi sotto).

Le quattro pagine sono collegate tra loro con una barra di navigazione in
alto (Home / Tool / Plugin IITC / Unisci CSV), coerente su tutte.

## La chiave Carto (facoltativa)

Serve solo per disegnare la mappa reale con le strade (tile "Dark Matter",
coerenti con il tema scuro dell'app) nel pannello dell'alternativa
selezionata, via Leaflet. Senza configurarla, l'app mostra comunque tutto
correttamente — solo con una mappa schematica (punti e linee in scala,
niente tile stradali) invece della mappa vera.

Per ottenerla: vai su https://carto.com/basemaps/apikey/, nessun account né
carta di credito richiesti, arriva subito via email. Gratuita fino a 5
milioni di richieste di tile al mese per uso non commerciale (1 milione se
commerciale) — un progetto personale come questo non si avvicina nemmeno a
quella soglia. È una chiave pensata per stare nell'URL del tile lato
browser, quindi pubblica per natura, esattamente come lo sarebbe stata una
chiave Google Maps "browser".

## Deploy su Vercel

1. Importa questa cartella su vercel.com/new (anche senza repo Git, si può
   trascinare la cartella).
2. (Opzionale) **Project Settings → Environment Variables** →
   `CARTO_API_KEY` se vuoi la mappa con le strade.
3. Deploy. Nessun altro setup richiesto — niente Supabase, niente database.

## Unione CSV (`merge.html`)

Pagina indipendente, tutto lato client: carica più CSV con export di
portali, riconosce automaticamente le colonne comuni (guid/title/lat/lng con
varianti case-insensitive), rimuove i duplicati (per guid, o per coordinate
arrotondate se il guid manca) e produce un JSON pronto da caricare nel tool
principale.
