// (newly added on Mar2 -- Pailsey commented) 
// the chunk below are randomizing a restaurant on the first page of the website
// so like everytime the user click into our website, it will generize one restaurant!
async function setRandomHeroBackground() {
  const hero = document.querySelector(".hero");
  const featured = document.getElementById("featuredRestaurant");
  if (!hero) return;

  try {
    const res = await fetch("assets/YelpBusiness.json");
    if (!res.ok) throw new Error("JSON not found");

    const data = await res.json();

    const restaurants = data.businesses || data;

    const withImages = restaurants.filter(r => r.image_url);
    if (withImages.length === 0) return;

    const pick = withImages[Math.floor(Math.random() * withImages.length)];

    hero.style.backgroundImage = `url("${pick.image_url}")`;
// the "feature" button will direct the user to the Yelp page!
    if (featured) {
      featured.innerHTML =
        `Featured: <a href="${pick.url}" target="_blank">${pick.name} [see on Yelp page]</a>`;
    }

  } catch (err) {
    console.error(err);
  }
}

// (newly added on Mar2 -- Pailsey commented) it's the map little map in the bottom right on the home page
// (for some reason we have to have a little map on our front page if we are doing the random background)
// because I dont think we can use the API to fetch photos
// so instead of that, I uploaded one json file to the '/assets' ! 
// if we still want the random photo function! I think we cannot delete this chunk > <!
// but it's very okay if we change the style of it!
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  mapboxgl.accessToken = "pk.eyJ1IjoicGFpc2xleXc4MjkiLCJhIjoiY21oZTY4Z3h6MGFpbzJsb2UzbWkxZjZybyJ9.qvAAm5rLQZPLPn8ltX2vLg";

  new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-122.3321, 47.6062],
    zoom: 12
  });
}


// initial declarations

// contact
function plusSlide(num) {
  currentSlide += num;
  
  if (currentSlide > totalSlides) {
  currentSlide = 1;
  } else if (currentSlide < 1) {
  currentSlide = totalSlides;
  }
  
  showSlide(currentSlide);
}

function goToSlide(slideNumber) {
  showSlide(slideNumber);
}

function showSlide(slideNumber) {
  const slides = document.getElementsByClassName('slide');
  const dots = document.getElementsByClassName('dot');
  
  for (let i = 0; i < slides.length; i++) {
  slides[i].classList.remove('active');
  }
  
  for (let i = 0; i < dots.length; i++) {
  dots[i].classList.remove('active');
  }
  
  slides[slideNumber - 1].classList.add('active');
  dots[slideNumber - 1].classList.add('active');
  document.getElementById('current-slide').textContent = slideNumber;
}

// (newly added on Mar2 -- Pailsey commented) this function is for letting the functions run after our HTML page is fully loaded!!!
window.addEventListener("DOMContentLoaded", () => {
  setRandomHeroBackground();
  initMap();
  showSlide(1);
});