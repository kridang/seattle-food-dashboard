// added on 3/8, Allen commented
// Two visualization charts when no selection on the map (default view)

let categoryChart;
let priceChart;

function parseCategoryString(categoryStr) {
  if (!categoryStr) return [];
  return categoryStr
    .replace(/[\[\]']/g, "")
    .split(",")
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function buildCategoryCounts(features) {
  const counts = {};

  features.forEach(feature => {
    const props = feature.properties;
    const categories = parseCategoryString(props.Category);

    categories.forEach(cat => {
      counts[cat] = (counts[cat] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12); // top 12 categories only

  return {
    labels: sorted.map(item => item[0]),
    values: sorted.map(item => item[1])
  };
}

function buildPriceCounts(features) {
  const counts = {
    "$": 0,
    "$$": 0,
    "$$$": 0,
    "$$$$": 0,
    "Unknown": 0
  };

  features.forEach(feature => {
    const props = feature.properties;
    const price = props.Price ? props.Price.trim() : "Unknown";

    if (counts.hasOwnProperty(price)) {
      counts[price]++;
    } else {
      counts["Unknown"]++;
    }
  });

  return {
    labels: ["$", "$$", "$$$", "$$$$", "Unknown"],
    values: [
      counts["$"],
      counts["$$"],
      counts["$$$"],
      counts["$$$$"],
      counts["Unknown"]
    ]
  };
}

function renderCharts(features) {
  const categoryCanvas = document.getElementById("categoryChart");
  const priceCanvas = document.getElementById("priceChart");

  if (!categoryCanvas || !priceCanvas) return;

  const categoryData = buildCategoryCounts(features);
  const priceData = buildPriceCounts(features);

  if (categoryChart) categoryChart.destroy();
  if (priceChart) priceChart.destroy();

const pieColors = [ // color palette for pie chart (up to 12 colors)
  "#4E79A7",
  "#F28E2B",
  "#E15759",
  "#76B7B2",
  "#59A14F",
  "#EDC948",
  "#B07AA1",
  "#FF9DA7",
  "#9C755F",
  "#BAB0AC",
  "#86BCB6",
  "#F1CE63",
  "#D37295",
  "#8CD17D",
  "#499894"
];

categoryChart = new Chart(categoryCanvas, {
  type: "pie",
  data: {
    labels: categoryData.labels,
    datasets: [{
      data: categoryData.values,
      backgroundColor: pieColors.slice(0, categoryData.labels.length),
      borderColor: "#ffffff",
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  }
  });

  priceChart = new Chart(priceCanvas, {
    type: "bar",
    data: {
      labels: priceData.labels,
      datasets: [{
        label: "Number of Restaurants",
        data: priceData.values
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

function showDashboardView() {
  const defaultDashboard = document.getElementById("default-dashboard");
  const restaurantDetail = document.getElementById("restaurant-detail");

  if (defaultDashboard) defaultDashboard.style.display = "block";
  if (restaurantDetail) restaurantDetail.style.display = "none";
}

function showRestaurantDetail(props) {
  const defaultDashboard = document.getElementById("default-dashboard");
  const restaurantDetail = document.getElementById("restaurant-detail");
  const infoCard = document.querySelector(".card-details");
  const detailExtra = document.querySelector(".detail-extra");

  if (defaultDashboard) defaultDashboard.style.display = "none";
  if (restaurantDetail) restaurantDetail.style.display = "block";

  if (infoCard) {
    infoCard.innerHTML = `
      <h3>${props.Name || "Restaurant Information"}</h3>
      <p>⭐ ${props.Star || "N/A"} (${props.Stars_count || 0} reviews)</p>
      <p><strong>Price:</strong> ${props.Price || "N/A"}</p>
      <p><strong>Area:</strong> ${props.Area || "N/A"}</p>
      <p><strong>City:</strong> ${props["Searched City"] || "N/A"}</p>
    `;
  }

  if (detailExtra) {
    detailExtra.innerHTML = `
      <h3>More Details</h3>
      <p><strong>Category:</strong> ${props.Category || "N/A"}</p>
      <p><strong>Services:</strong> ${props.Services || "N/A"}</p>
      <p><button id="backToDashboard">Back to charts</button></p>
    `;

    const backBtn = document.getElementById("backToDashboard");
    if (backBtn) {
      backBtn.addEventListener("click", showDashboardView);
    }
  }
}


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

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-122.3321, 47.6062],
    zoom: 12
  });

  //edited on Mar8, Allen commented
  // load the geojson data for the statistics and charts and add to the map as a layer
  map.on('load', async () => {
    try {
      const response = await fetch('assets/sea_restaurants.geojson');
      const geojsonData = await response.json();
      const totalRestaurants = geojsonData.features.length;
      document.getElementById("restaurantCount").innerText = totalRestaurants;

      map.addSource('restaurants', {
        type: 'geojson',
        data: geojsonData
      });

      map.addLayer({
        id: 'restaurant-points',
        type: 'circle',
        source: 'restaurants',
        paint: {
          'circle-radius': 6,
          'circle-color': '#e63946',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });

      // default state = show charts
      if (geojsonData.features) {
        renderCharts(geojsonData.features);
        showDashboardView();
      }

      // when user clicks a restaurant dot, show restaurant detail instead of charts
      map.on('click', 'restaurant-points', (e) => {
        const feature = e.features[0];
        const props = feature.properties;
        showRestaurantDetail(props);
      });

      // cursor pointer
      map.on('mouseenter', 'restaurant-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'restaurant-points', () => {
        map.getCanvas().style.cursor = '';
      });

    } catch (err) {
      console.error("Error loading restaurant GeoJSON:", err);
    }
  });

    // when user clicks a restaurant dot, show that restaurant's info in the left panel
    map.on('click', 'restaurant-points', (e) => {
      const feature = e.features[0];
      const props = feature.properties;

      const infoCard = document.querySelector('.card-details');
      const descriptionCard = document.querySelector('.description-card');

      if (infoCard) {
        infoCard.innerHTML = `
          <h3>Information</h3>
          <p>⭐ ${props.Star} (${props.Stars_count} reviews)</p>
          <p>Price: ${props.Price}</p>
          <p>Area: ${props.Area}</p>
          <p>${props["Searched City"]}</p>
        `;
      }

      if (descriptionCard) {
        descriptionCard.innerHTML = `
          <h3>${props.Name}</h3>
          <p><strong>Category:</strong> ${props.Category}</p>
          <p><strong>Services:</strong> ${props.Services}</p>
        `;
      }
    });

    // change mouse cursor when hovering restaurant points
    map.on('mouseenter', 'restaurant-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'restaurant-points', () => {
      map.getCanvas().style.cursor = '';
    });


}


// initial declarations

// contact page
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