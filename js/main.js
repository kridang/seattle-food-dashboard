// initial declarations

let categoryChart;
let priceChart;
// two visualization charts when no selection on the map (default view)

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

// randomizing a restaurant in BG on the first page of the website
// (for some reason we have to have a little map on our front page if we are doing the random background)
// little map on front page NOW used as tutorial / onboarding?
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

function initMap() {
  mapboxgl.accessToken = "pk.eyJ1IjoicGFpc2xleXc4MjkiLCJhIjoiY21oZTY4Z3h6MGFpbzJsb2UzbWkxZjZybyJ9.qvAAm5rLQZPLPn8ltX2vLg";

  // init map, hover popup
  let geojsonData;
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-122.3321, 47.6062],
    zoom: 12,
    minZoom: 10
  });

  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  // load the geojson data for the statistics and charts and add to the map as a layer
  map.on('load', async () => {
    try {
      const response = await fetch('assets/sea_restaurants.geojson');
      geojsonData = await response.json();
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
          'circle-radius': 5,
          'circle-color': '#9633d8',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000'
        }
      });

      // dynamic charts depending on map bounds
      renderCharts(geojsonData.features);
      map.on("moveend", updateChartsInView);

      function getRestaurantsInBounds(features, bounds) {
        return features.filter(f => bounds.contains(f.geometry.coordinates));
      }

      function updateChartsInView() {
        if (!geojsonData || !geojsonData.features) return;

        const bounds = map.getBounds();
        const featuresInView = getRestaurantsInBounds(geojsonData.features, bounds);
        renderCharts(featuresInView);
      }

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
        <h3>${props.Name || "Unknown Restaurant"}</h3>
        <p><strong>Category:</strong> ${props.Category || "N/A"}</p>
        <p><strong>Services:</strong> ${props.Services || "N/A"}</p>
        <p><strong>Price Range:</strong> ${props.Price || "N/A"}</p>
        <p><strong>Star Rating:</strong> ${props.Star || "N/A"}</p>
        <p><strong>Review Count:</strong> ${props.Stars_count || "N/A"}</p>
        <p><strong>Area:</strong> ${props.Area || "N/A"}</p>
      `;
    }
  });

  // hover popup with stars and rest. name
  map.on('mousemove', 'restaurant-points', (e) => {
    const feature = e.features[0];
    const coords = feature.geometry.coordinates.slice();

    // stars : https://emojicombos.com/star
    const rating = Math.round(feature.properties.Star || 0);
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    hoverPopup
      .setLngLat(coords)
      .setHTML(`
        <h4>${feature.properties.Name}</h4>
        <p>${stars}</p>
        <p>${feature.properties.Stars_count} reviews</p>`)
      .addTo(map);

    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'restaurant-points', () => {
    hoverPopup.remove();
  });
}

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

// this function is for letting the functions run after our HTML page is fully loaded!!!
window.addEventListener("DOMContentLoaded", () => {
  setRandomHeroBackground();
  initMap();
  showSlide(1);
});