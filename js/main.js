// mapboxgl.accessToken = 

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.3321, 47.6062],
    zoom: 12
});

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