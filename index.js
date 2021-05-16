// If the user isn't logged in on first load, they're prompted to.
(function () {
  if (window.location.href.includes("#access_token") != true) {
    console.log("No #access_token found; showing prompt to login via Spotify Auth API.");
    document.getElementById("signIn").style.display = "";
  } else {
    console.log("#access_token found")
    document.getElementById("signIn").innerHTML =
      `<h2 id="error-title"></h2> <p id="error-body"></p>`;
    document.getElementById("signIn").style.display = "none";
    document.getElementById("form").style.display = "";
    document.getElementById("results").style.display = "";
  }
})();

// Derives the track/album ID from the URI
function getTrackOrAlbumId() {
  let input = document.getElementById("identifier").value.trim();
  if (input.startsWith("open.spotify.com")) {
    input = "https://" + input;
  }
  let url;
  try {
    url = new URL(input);
  } catch (_) {
    return [null, `Failed to recognize a URI/URL: ${input}`];
  }
  url.search = "";
  const path = url.pathname;
  if (url.protocol === "spotify:") {
    // Spotify internal URI
    if (path.startsWith("album:")) {
      return [path.replace(/^album:/, ""), "album"];
    }
    if (path.startsWith("track:")) {
      return [path.replace(/^track:/, ""), "track"];
    }
    return [null, "Spotify URI is found, but it's not a album or track."];
  }
  if (url.protocol === "https:" || url.protocol === "http:") {
    // Spotify URL
    if (path.startsWith("/album/")) {
      return [path.replace(/^\/album\//,""), "album"];
    }
    if (path.startsWith("/track/")) {
      return [path.replace(/^\/track\//,""), "track"];
    }
    return [null, "Spotify URL is found, but it's not a album or track URL."];
  }
  console.error(msg);
  return [null, `Neither "spotify:track:", "spotify:album:", "https://open.spotify.com/track/", or "https://open.spotify.com/album/" were found in the input: ${input}`];
}

function query() {
  // Sets the user access token as returned by Spotify Web API
  const urlHash = window.location.hash.substring(1).split("&").reduce(function (initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});

  const accessToken = urlHash.access_token;

  const trackOrAlbumId = getTrackOrAlbumId();

  if (trackOrAlbumId[0] === null) {
    console.error(trackOrAlbumId[1]);
    document.getElementById("error-title").innerText = "Kira can't recognize your input.";
    document.getElementById("error-body").innerText = trackOrAlbumId[1];
    document.getElementById("signIn").style.display = "";
    document.getElementById("markets").style.display = "none";
    return;
  }

  var request = new XMLHttpRequest();
  request.open('GET', `https://api.spotify.com/v1/${trackOrAlbumId[1]}s/${trackOrAlbumId[0]}`, true);
  request.setRequestHeader("Authorization", "Bearer " + accessToken);
  request.responseType = "json";

  request.send();

  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      console.log(this.response);
      var resp = this.response;
      var track = resp.name;
      var artist = resp.artists[0].name;
      var markets = resp.available_markets;

      if (markets.length == 0) {
        var markets = resp.album.available_markets;
        if (markets.length == 0) {
        console.error("There was an error: track is relinked.");
        document.getElementById("error-title").innerText = "Kira isn't able to process this track right now.";
        document.getElementById("error-body").innerText = "The way that Spotify stores this track metadata means that Kira isn't able to get the countries where this track is available just yet. I'm working on finding a way, but for now, you may need to use another tool instead";
        document.getElementById("signIn").style.display = "";
        document.getElementById("markets").style.display = "none";
        } else {
          document.getElementById("markets-label").innerHTML = "<strong>" + track + "</strong> by <strong>" + artist + "</strong> can be streamed in " + markets.length + " countries:";
          document.getElementById("markets").style.display = "";
          document.getElementById("signIn").style.display = "none";
          document.getElementById("markets").innerHTML = "";
          for (var i = 0; i < markets.length; i++) {
            let country = countries[markets[i]];
            const item = document.createElement("li");
            item.innerHTML = country;
            document.getElementById("markets").appendChild(item);
          }
        }
      } else {
        document.getElementById("markets-label").innerHTML = "<strong>" + track + "</strong> by <strong>" + artist + "</strong> can be streamed in " + markets.length + " countries:";
        document.getElementById("markets").style.display = "";
        document.getElementById("signIn").style.display = "none";
        document.getElementById("markets").innerHTML = "";
        for (var i = 0; i < markets.length; i++) {
          let country = countries[markets[i]];
          const item = document.createElement("li");
          item.innerHTML = country;
          document.getElementById("markets").appendChild(item);
        }
      }
    } else {
      console.error("There was an error: connection made, but returned an error status code: " + this.status + ".");
      document.getElementById("error-title").innerText = "Kira is having a few issues right now.";
      document.getElementById("error-body").innerText = "Something has happened when talking to Spotify and an error was thrown (" + this.status + "). Try again a little bit later?";
      document.getElementById("signIn").style.display = "";
      document.getElementById("markets").style.display = "none";
    }
  };

  request.onerror = function () {
    console.error("There was an error: a connection could not be made to the Spotify Web API. It may be unavailable right now.");
    document.getElementById("error-title").innerText = "Kira can't reach Spotify right now.";
    document.getElementById("error-body").innerText = "Something's happened and Kira isn't able to reach Spotify's servers right now. Try again a little bit later?";
    document.getElementById("markets").style.display = "none";
  };
}

const countries = {
  // Asia
  AU: "Australia",
  JP: "Japan",
  IL: "Israel",
  HK: "Hong Kong",
  ID: "Indonesia",
  MY: "Malaysia",
  NZ: "New Zealand",
  PH: "Philippines",
  SG: "Singapore",
  TW: "Taiwan",
  TH: "Thailand",
  VN: "Vietnam",
  IN: "India",
  // Europe
  AL: "Albania",
  AD: "Andorra",
  AT: "Austria",
  BY: "Belarus",
  BE: "Belgium",
  BA: "Bosnia and Herzegovina",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GR: "Greece",
  HU: "Hungary",
  IS: "Iceland",
  IE: "Ireland",
  IT: "Italy",
  KZ: "Kazakhstan",
  XK: "Kosovo",
  LV: "Latvia",
  LI: "Liechtenstien",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  MD: "Moldova",
  MC: "Monaco",
  ME: "Montenegro",
  NL: "Netherlands",
  NO: "Norway",
  MK: "North Macedonia",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RU: "Russia",
  RS: "Serbia",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  CH: "Switzerland",
  TR: "Turkey",
  UA: "Ukraine",
  GB: "United Kingdom",
  // Latin America and the Caribbean
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brazil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  SV: "El Savador",
  GT: "Guatamala",
  HN: "Honduras",
  MX: "Mexico",
  NI: "Nicaragua",
  PA: "Panama",
  PY: "Paraguy",
  PE: "Peru",
  UY: "Uruguay",
  // North America
  CA: "Canada",
  US: "United States",
  // Africa
  ZA: "South Africa",
  // MENA
  DZ: "Algeria",
  BH: "Bahrain",
  EG: "Egypt",
  JO: "Jordan",
  KW: "Kuwait",
  LB: "Lebanon",
  MA: "Morocco",
  OM: "Oman",
  PS: "Palestine",
  QA: "Qatar",
  SA: "Saudi Arabia",
  TN: "Tunisia",
  AE: "United Arab Emirates"
};