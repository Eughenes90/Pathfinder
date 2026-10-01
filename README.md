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

- `index.html` — homepage + tool (upload, calcolo, mappa, link Google Maps)
- `merge.html` — unisce più export CSV in un unico JSON/CSV senza duplicati,
  tutto lato client
- `api/config.js` — espone solo `GOOGLE_MAPS_BROWSER_KEY` (opzionale, solo
  per la mappa con le strade nell'anteprima — vedi sotto)

## La chiave Maps "browser" (facoltativa)

Serve solo per disegnare la mappa reale con le strade nel pannello
dell'alternativa selezionata. Senza configurarla, l'app mostra comunque tutto
correttamente — solo con una mappa schematica (punti e linee in scala,
niente tile stradali) invece della mappa vera. Se la aggiungi: crea una
chiave con **Maps JavaScript API** abilitata in Google Cloud Console, e
restringila per **HTTP referrer** al tuo dominio Vercel — è una chiave
pensata per essere pubblica, la sicurezza sta nella restrizione di dominio,
non nel nasconderla.

## Deploy su Vercel

1. Importa questa cartella su vercel.com/new (anche senza repo Git, si può
   trascinare la cartella).
2. (Opzionale) **Project Settings → Environment Variables** →
   `GOOGLE_MAPS_BROWSER_KEY` se vuoi la mappa con le strade.
3. Deploy. Nessun altro setup richiesto — niente Supabase, niente database.

## Unione CSV (`merge.html`)

Pagina indipendente, tutto lato client: carica più CSV con export di
portali, riconosce automaticamente le colonne comuni (guid/title/lat/lng con
varianti case-insensitive), rimuove i duplicati (per guid, o per coordinate
arrotondate se il guid manca) e produce un JSON pronto da caricare nel tool
principale.
