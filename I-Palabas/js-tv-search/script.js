/*
"Talk is cheap. Show me the code."
—Linus Torvalds
*/

// Palabas · WS1 TV Show Search code-along (TVmaze API, no key needed)
// Open DevTools (F12): keep the Console AND the Network tab open.
// Sample or live mode: see config.js.

// ---------- Given: page elements ----------
const form = document.getElementById("searchForm");
const input = document.getElementById("query");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const dialog = document.getElementById("details");
const detailsBody = document.getElementById("detailsBody");
const closeBtn = document.getElementById("closeDetails");
const modeBadge = document.getElementById("modeBadge");

// ---------- Given: the API's URLs ----------
const API = "https://api.tvmaze.com";

// Turns "Breaking Bad" into "breaking-bad" (used for the sample-data file names)
function slug(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// e.g. https://api.tvmaze.com/search/shows?q=breaking%20bad
function searchURL(query) {
  if (USE_SAMPLE_DATA) return `data/search/${slug(query)}.json`;
  return `${API}/search/shows?q=${encodeURIComponent(query)}`;
}

// e.g. https://api.tvmaze.com/shows/169
function showURL(id) {
  return USE_SAMPLE_DATA ? `data/shows/${id}.json` : `${API}/shows/${id}`;
}

// e.g. https://api.tvmaze.com/shows/169/cast
function castURL(id) {
  return USE_SAMPLE_DATA ? `data/cast/${id}.json` : `${API}/shows/${id}/cast`;
}

// e.g. https://api.tvmaze.com/shows/169/seasons
function seasonsURL(id) {
  return USE_SAMPLE_DATA ? `data/seasons/${id}.json` : `${API}/shows/${id}/seasons`;
}

// ---------- Given: helpers (no need to change) ----------

// Shows a message under the search box. type: "info", "loading" or "error"
function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.className = "status " + type;
}

// Makes an element with an optional class and text: el("span", "year", "2008")
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A poster <img>, or a placeholder when the show has no image (image is null)
function createPoster(show, size = "medium") {
  if (!show.image) {
    return el("span", "poster none", "No poster");
  }
  const img = el("img", "poster");
  img.src = show.image[size] || show.image.medium;
  img.alt = `Poster: ${show.name}`;
  img.loading = "lazy";
  img.addEventListener("error", () => img.replaceWith(el("span", "poster none", "No poster")));
  return img;
}

// "2008–2013", or "2016–" for a show that is still running
function yearRange(show) {
  const start = show.premiered ? show.premiered.slice(0, 4) : "?";
  const end = show.ended ? show.ended.slice(0, 4) : "";
  return `${start}–${end}`;
}

// TVmaze summaries contain HTML like "<p><b>Friends</b> follows…</p>".
// This keeps only the text. (Never put text from an API into innerHTML:
// if it contained a <script> or an onerror, it could run on your page.)
function stripTags(html) {
  if (!html) return "No summary yet.";
  return new DOMParser().parseFromString(html, "text/html").body.textContent;
}

// Close the details pop-up (Step 4) with the × button or by clicking outside it
closeBtn.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// Show which mode we're in
modeBadge.textContent = USE_SAMPLE_DATA ? "Sample data" : "Live · TVmaze";
modeBadge.classList.toggle("live", !USE_SAMPLE_DATA);

/*----------------------------------------------------------------------------*/

// STEP 1 — Your first API request
// TODO: async function testRequest(): fetch searchURL("friends"), log the status and the JSON array


/* 
  In this step, we will test whether our JavaScript application 
  can successfully connect to the TVmaze API and retrieve TV show information. 
*/

// This function tests the API connection and displays the received TV show data in the Console.
async function testRequest() {

  // Creates the search URL for the TV show Friends.
  const url = searchURL("friends");
  console.log("Request:", url); 

  // Sends a request to the URL and waits for the response.
  const response = await fetch(url); 
  console.log("Status:", response.status, "ok?", response.ok);

  // Converts the received response into JavaScript data.
  const data = await response.json(); 

  // Displays all the received data in the Console.
  console.log(data); 
  
  // Displays the total number of search results.
  console.log("How many:", data.length);

  // Displays the name and premiere date of the first TV show.
  console.log("First show:", data[0].show.name, data[0].show.premiered);
}

// Calls the function to start testing the API request.
testRequest();

/*----------------------------------------------------------------------------*/

// STEP 2 — Search and show the results
// TODO: renderResults(items), searchShows(query), and a submit listener on the form

/* 
  In this step, we create a search feature that fetches TV shows from the TVmaze API.
  When the user submits the search form, JavaScript reads the input, requests matching
  shows from the API, and displays each result as a clickable card.
*/

// Displays the TV show search results as clickable cards inside #results.
function renderResults(items) {
  // Clears any previous search results before rendering new ones.
  results.innerHTML = "";

  items.forEach((item) => {
    // Extracts the show object from the current search result item.
    const show = item.show;

    // Creates a clickable <button class="card"> element for the show.
    const card = el("button", "card");
    card.type = "button";

    // Stores the show's unique ID in a data attribute for opening details later.
    card.dataset.id = show.id;

    // Retrieves the show's average rating (or null if unrated).
    const rating = show.rating.average;

    // Packs the poster, title, years, genres, and rating inside the card button.
    card.append(
      createPoster(show),
      el("span", "title", show.name),
      el("span", "year", yearRange(show)),
      el("span", "genres", show.genres.join(", ")),
      el("span", "rating", rating ? `★ ${rating}` : "Not rated yet")
    );

    // Appends the completed show card to the #results container on the page.
    results.appendChild(card);
  });
}

// Fetches matching TV shows from the TVmaze API and passes them to renderResults.
async function searchShows(query) {
  const response = await fetch(searchURL(query));
  const data = await response.json();

  renderResults(data);
}

// Listens for the search form submission and triggers the API search.
form.addEventListener("submit", (event) => {
  // Prevents the default page reload when the form is submitted.
  event.preventDefault();

  // Reads the search input value and trims leading/trailing whitespace.
  const query = input.value.trim();

  // Ignores empty searches.
  if (query === "") return;

  // Runs the search with the cleaned query string.
  searchShows(query);
});

/* 
  Reflection Note:
  I searched for "superman" in sample mode and live mode. In sample mode, the application
  only recognizes the titles included in its sample data. In live mode, it searches the
  TVmaze API and displays a no-results message if no matching show is found.
*/


/*----------------------------------------------------------------------------*/

// STEP 3 — getJSON(): one careful helper for every request
// TODO: catch network errors, check 429 and response.ok; rewrite searchShows with try / catch and an empty-array check

/* 
  In this step, we create a reusable function called getJSON() to handle API requests and errors. 
  It checks for problems such as no internet connection, too many requests (429), or unsuccessful 
  API responses. We also update searchShows() to use getJSON() with loading, result, and error states.
*/

// This function sends an API request, checks for possible errors, and returns the received data.
async function getJSON(url) {
  let response;

  try {
    // Sends a request to the API and waits for the response.
    response = await fetch(url);

  } catch (networkError) {
    // Handles problems when the application cannot reach the API.
    throw new Error("Can't reach TVmaze. Check your internet, or set USE_SAMPLE_DATA = true in config.js.");
  }

  // Checks if too many API requests have been sent.
  if (response.status === 429) {
    throw new Error("Too many requests (429). Wait 10 seconds and try again.");
  }

  // Checks if the API request was unsuccessful.
  if (!response.ok) {
    throw new Error(
      USE_SAMPLE_DATA
        ? "Sample mode only knows: friends, office, breaking bad, stranger things, sherlock, thrones, sample."
        : `Request failed (HTTP ${response.status}).`
    );
  }

  // Converts the successful response into JavaScript data and returns it.
  return response.json();
}


// This function searches for TV shows, checks the results, and displays messages to the user.
async function searchShows(query) {
  // Displays a loading message while searching.
  setStatus(`Searching for "${query}"…`, "loading");

  // Clears the previous search results.
  results.innerHTML = "";

  try {
    // Requests the TV show data using the getJSON helper function.
    const data = await getJSON(searchURL(query));

    // Checks if the API returned an empty list of search results.
    if (data.length === 0) {
      setStatus(`No shows found for "${query}". Check the spelling.`, "error");
      return;
    }

    // Displays the TV show results.
    renderResults(data);

    // Displays the number of shows found.
    setStatus(`${data.length} ${data.length === 1 ? "show" : "shows"} found for "${query}"`);

  } catch (error) {
    // Displays the error message if something goes wrong.
    setStatus(error.message, "error");
  }
}

/*----------------------------------------------------------------------------*/

// STEP 4 — Click a show to see its details
// TODO: one click listener on #results, showDetails(id), renderDetails(show)

/* 
  In this step, we make the TV show cards clickable so users can view more information 
  about their selected show. When a user clicks a card, the application gets the show's ID 
  and uses it to request detailed information from the TVmaze API, displaying it inside a pop-up window.
*/

/* 
// This event listener detects which TV show card the user clicks.
results.addEventListener("click", (event) => {
  // Finds the card that was clicked using closest().
  const card = event.target.closest(".card");

  // Opens the selected show's details using its unique dataset ID.
  if (card) showDetails(card.dataset.id);
});


// This function fetches the selected show's information and opens the pop-up modal.
async function showDetails(id) {
  // Displays a loading message while fetching the show information.
  detailsBody.replaceChildren(el("p", "status loading", "Loading details…"));

  // Opens the details pop-up dialog.
  dialog.showModal();

  try {
    // Requests the selected show's detailed information from the API.
    const show = await getJSON(showURL(id));

    // Displays the received information inside the pop-up.
    renderDetails(show);

  } catch (error) {
    // Displays an error message inside the pop-up if the request fails.
    detailsBody.replaceChildren(el("p", "status error", error.message));
  }
}


// This function displays the show's large poster and complete information.
function renderDetails(show) {
  // Gets the network name or streaming platform.
  const where = show.network
    ? show.network.name
    : show.webChannel
      ? show.webChannel.name
      : "";

  // Uses average runtime if the regular runtime is unavailable.
  const minutes = show.runtime || show.averageRuntime;

  // Creates a container for the show's information.
  const info = el("div", "info");

  info.append(
    // Displays the show's title.
    el("h2", "", show.name),

    // Displays the years, network, genres, and runtime joined together.
    el("p", "meta", [
      yearRange(show),
      where,
      show.genres.join(", "),
      minutes ? `${minutes} min` : ""
    ].filter(Boolean).join(" · ")),

    // Displays the show's rating or a message if it has no rating.
    el("p", "score", show.rating && show.rating.average
      ? `★ ${show.rating.average} / 10`
      : "Not rated yet"),

    // Displays the summary text stripped of HTML tags.
    el("p", "plot", stripTags(show.summary))
  );

  // Creates an external link to the show's official TVmaze page.
  const links = el("p", "links");
  const tvmaze = el("a", "", "View on TVmaze ↗");

  tvmaze.href = show.url;
  tvmaze.target = "_blank";

  links.append(tvmaze);
  info.append(links);

  // Displays the large poster and the structured info block inside the pop-up body.
  detailsBody.replaceChildren(createPoster(show, "original"), info);
}
*/

/*----------------------------------------------------------------------------*/

// STEP 5 — Promise.all: show + cast + seasons at the same time
// TODO: rewrite showDetails with Promise.all, and renderDetails(show, cast, seasons)

/* 
  In this step, we add a retry mechanism to getJSON(). When the TVmaze API 
  returns a 429 (Too Many Requests) status code, the application will wait 
  for 2 seconds, display a "Busy, retrying" status message, and attempt 
  the request one more time before finally throwing an error[cite: 7].
*/

// This function sends an API request, checks for errors, and handles automatic retries for HTTP 429.
async function getJSON(url) {
  let response

  try {
    // Sends a request to the API and waits for the response.
    response = await fetch(url);
  } catch (networkError) {
    // Handles problems when the application cannot reach the API.
    throw new Error("Can't reach TVmaze. Check your internet, or set USE_SAMPLE_DATA = true in config.js.");
  }

  // Checks if too many API requests have been sent (HTTP 429).
  if (response.status === 429) {
    // Updates the status message to notify the user.
    setStatus("Busy, retrying...", "loading");

    // Waits for 2 seconds before retrying the fetch request.
    await new Promise((r) => setTimeout(r, 2000));

    try {
      response = await fetch(url);
    } catch (networkError) {
      throw new Error("Can't reach TVmaze. Check your internet, or set USE_SAMPLE_DATA = true in config.js.");
    }

    // If it fails with 429 a second time, throw the final error message.
    if (response.status === 429) {
      throw new Error("Too many requests (429). Wait 10 seconds and try again.");
    }
  }

  // Checks if the API request was unsuccessful.
  if (!response.ok) {
    throw new Error(
      USE_SAMPLE_DATA
        ? "Sample mode only knows: friends, office, breaking bad, stranger things, sherlock, thrones, sample."
        : `Request failed (HTTP ${response.status}).`
    );
  }

  // Converts the successful response into JavaScript data and returns it.
  return response.json();
}