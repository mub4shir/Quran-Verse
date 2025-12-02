const twitterButton = document.querySelector("#js-tweet");
const spinner = document.querySelector("#js-spinner");
const newQuoteButton = document.querySelector("#js-new-quote");
newQuoteButton.addEventListener("click", getQuote);

// ---- New config for AlQuran Cloud API ----
const BASE = "https://api.alquran.cloud/v1";
const EDITION = "en.asad"; // e.g., 'en.asad', 'en.pickthall', 'ar.alafasy'

// Cache surah metadata so we can pick valid ayah numbers per chapter
let surahList = null; // [{ number, name, englishName, ayahs }] where ayahs = number of verses

async function loadSurahs() {
  if (surahList) return surahList;
  const res = await fetch(`${BASE}/surah`);
  if (!res.ok) throw new Error("Failed to load surah list");
  const json = await res.json();
  // API returns { data: [ { number, name, englishName, englishNameTranslation, numberOfAyahs, ... } ] }
  surahList = json.data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    ayahs: s.numberOfAyahs,
  }));
  return surahList;
}

function randInt(min, maxInclusive) {
  return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

async function getRandomReference() {
  const surahs = await loadSurahs();
  const s = surahs[randInt(0, surahs.length - 1)];
  const ayahInSurah = randInt(1, s.ayahs);
  const reference = `${s.number}:${ayahInSurah}`; // surah:ayah
  return { reference, surahMeta: s, ayahInSurah };
}

async function getQuote() {
  spinner.classList.remove("hidden");
  newQuoteButton.disabled = true;

  try {
    const { reference } = await getRandomReference();
    const url = `${BASE}/ayah/${reference}/${EDITION}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    const { data } = await response.json();
    // data.text, data.surah.englishName, data.numberInSurah
    const text = data.text;
    const chapter = data.surah.englishName;
    const ayahNo = data.numberInSurah;
    const display = `${text} — ${chapter}, ${ayahNo}.`;
    displayQuote(display);
    setTweetButton(display);
  } catch (err) {
    console.error(err);
    alert("Failed to fetch new verse.");
  } finally {
    newQuoteButton.disabled = false;
    spinner.classList.add("hidden");
  }
}

function displayQuote(quote) {
  const quoteText = document.querySelector("#js-quote-text");
  quoteText.textContent = quote;
}

function setTweetButton(quote) {
  twitterButton.setAttribute(
    "href",
    `https://twitter.com/share?text=${encodeURIComponent(quote)}`
  );
}

// Initial load
getQuote();
