// Object mappings for property names and filter IDs
const propertyMap = {
  name: 'Title',
  alternativeHeadline: 'Original Title',
  datePublished: 'Date',
  director: 'Director',
  sameAs: 'URL',
  productionCompany: 'Production Company',
  countryOfOrigin: 'Country, Production',
  spatialCoverage: 'Country, Setting',
  temporalCoverage: 'Period',
  genre: 'Genre',
  isBasedOn: 'Literary Source',
  keywords: 'Keywords',
};

const filterMap = {
  yearFilter: 'datePublished',
  directorFilter: 'director',
  productionCompanyFilter: 'productionCompany',
  countryProductionFilter: 'countryOfOrigin',
  countrySettingFilter: 'spatialCoverage',
  periodFilter: 'temporalCoverage',
  genreFilter: 'genre',
  literarySourceFilter: 'isBasedOn',
};

// Global variables
let allMovies = [];
let allKeywords = new Set();

// Fetch and process movie data
fetch('https://raw.githubusercontent.com/chmsv/Analysis-of-Medieval-Aesthetics-in-Opening-Sequence/main/source/Medieval_Movies.jsonld')
  .then((response) => response.json())
  .then((data) => {
    allMovies = data['@graph'];
    populateFilters(allMovies);
    createKeywordCloud(extractKeywords(allMovies));
    renderGallery(allMovies);
    document.getElementById('keywordCloud').classList.add('hidden');
  })
  .catch((error) => console.error('Error:', error));

// Function to populate filters
function populateFilters(movies) {
  Object.entries(filterMap).forEach(([filterId, property]) => {
    const filterElement = document.getElementById(filterId);
    const values = new Set(
      movies
        .flatMap((movie) => {
          const value = movie[property];
          return Array.isArray(value)
            ? value.map(formatValue)
            : [formatValue(value)];
        })
        .filter(Boolean)
    );

    let sortedValues = Array.from(values);
    if (filterId === 'periodFilter') {
      sortedValues.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
      });
    } else {
      sortedValues.sort((a, b) => a.localeCompare(b));
    }

    sortedValues.forEach((value) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = value;
      item.dataset.value = value;
      filterElement.appendChild(item);
    });

    if (
      [
        'directorFilter',
        'productionCompanyFilter',
        'countryProductionFilter',
        'countrySettingFilter',
        'literarySourceFilter',
      ].includes(filterId)
    ) {
      addSearchFunctionality(filterId);
    }
  });
}

// Function to add search functionality to filters
function addSearchFunctionality(filterId) {
  const dropdown = document
    .getElementById(filterId)
    .closest('.custom-dropdown');
  const searchInput = dropdown.querySelector('.dropdown-search');
  const items = dropdown.querySelectorAll('.dropdown-item');

  searchInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    items.forEach((item) => {
      item.style.display = item.textContent.toLowerCase().includes(searchTerm)
        ? 'block'
        : 'none';
    });
  });

  searchInput.addEventListener('focus', () => {
    dropdown.querySelector('.dropdown-list').classList.add('show');
  });
}

// Function to update selected filters
function updateSelectedFilters() {
  const selectedFiltersContainer = document.getElementById('selectedFilters');
  selectedFiltersContainer.innerHTML = '';

  // Add selected filter items
  Object.keys(filterMap).forEach((filterId) => {
    document
      .querySelectorAll(`#${filterId} .dropdown-item.selected`)
      .forEach((item) => {
        addSelectedFilterElement(
          selectedFiltersContainer,
          item.textContent,
          () => {
            item.classList.remove('selected');
            updateSelectedFilters();
          }
        );
      });
  });

  // Add selected keywords
  document.querySelectorAll('.keyword.selected').forEach((keyword) => {
    addSelectedFilterElement(
      selectedFiltersContainer,
      keyword.textContent,
      () => {
        keyword.classList.remove('selected');
        updateSelectedFilters();
      }
    );
  });
}

// Helper function to add a selected filter element
function addSelectedFilterElement(container, text, removeCallback) {
  const filterElement = document.createElement('div');
  filterElement.className = 'selected-filter';
  filterElement.innerHTML = `${text} <span class="remove">&times;</span>`;
  filterElement.querySelector('.remove').addEventListener('click', (e) => {
    e.stopPropagation();
    removeCallback();
  });
  container.appendChild(filterElement);
}

// Function to render the movie gallery
function renderGallery(movies) {
  const gallery = document.getElementById('movieGallery');
  gallery.innerHTML = '';
  movies.forEach((movie) => {
    const movieElement = document.createElement('div');
    movieElement.className = 'movie';

    const img = document.createElement('img');
    img.src = movie.image;
    img.alt = movie.name;
    img.loading = 'lazy';
    img.style.backgroundColor = '#6e6e6e';
    movieElement.appendChild(img);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'movie-info';
    Object.entries(propertyMap).forEach(([prop, label]) => {
      if (movie[prop]) {
        const p = document.createElement('p');
        p.innerHTML =
          prop === 'sameAs'
            ? `<strong>${label}:</strong> <a href="${movie[prop]}" target="_blank">${movie[prop]}</a>`
            : `<strong>${label}:</strong> ${formatValue(movie[prop])}`;
        infoDiv.appendChild(p);
      }
    });
    movieElement.appendChild(infoDiv);
    gallery.appendChild(movieElement);
  });
}

// Helper function to format values
function formatValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => (item['@type'] ? item.name : item)).join(', ');
  } else if (typeof value === 'object' && value['@type']) {
    return value.name;
  }
  return value;
}

// Function to extract keywords from movies
function extractKeywords(movies) {
  movies.forEach((movie) => {
    if (Array.isArray(movie.keywords)) {
      movie.keywords.forEach((keyword) => {
        keyword.split(',').forEach((k) => allKeywords.add(k.trim()));
      });
    }
  });
  return Array.from(allKeywords).sort((a, b) => a.localeCompare(b));
}

// Function to create keyword cloud
function createKeywordCloud(keywords) {
  const cloudContainer = document.getElementById('keywordCloud');
  keywords.forEach((keyword) => {
    const keywordElement = document.createElement('span');
    keywordElement.className = 'keyword';
    keywordElement.textContent = keyword;
    keywordElement.addEventListener('click', (e) => {
      e.stopPropagation();
      keywordElement.classList.toggle('selected');
      updateSelectedFilters();
    });
    cloudContainer.appendChild(keywordElement);
  });

  document
    .querySelector('.keyword-cloud-toggle')
    .addEventListener('click', toggleKeywordCloud);
}

// Function to toggle keyword cloud visibility
function toggleKeywordCloud() {
  const toggle = document.querySelector('.keyword-cloud-toggle');
  const cloud = document.getElementById('keywordCloud');
  toggle.classList.toggle('active');
  cloud.classList.toggle('hidden');
}

// Event listener for dropdown headers
document.querySelectorAll('.dropdown-header').forEach((header) => {
  header.addEventListener('click', function () {
    const dropdown = this.closest('.custom-dropdown');
    dropdown.querySelector('.dropdown-list').classList.toggle('show');
    const searchInput = dropdown.querySelector('.dropdown-search');
    if (searchInput) {
      searchInput.focus();
    }
  });
});

// Event listener for dropdown items
document.querySelectorAll('.dropdown-list').forEach((list) => {
  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('dropdown-item')) {
      e.target.classList.toggle('selected');
      updateSelectedFilters();
    }
  });
});

// Event listener for apply filters button
document.getElementById('applyFilters').addEventListener('click', function () {
  let filteredMovies = allMovies;

  // Filter by dropdown selections
  Object.entries(filterMap).forEach(([filterId, property]) => {
    const selectedValues = Array.from(
      document.querySelectorAll(`#${filterId} .dropdown-item.selected`)
    ).map((item) => item.dataset.value);
    if (selectedValues.length > 0) {
      filteredMovies = filteredMovies.filter((movie) => {
        const movieValue = movie[property];
        return Array.isArray(movieValue)
          ? movieValue.some((v) => selectedValues.includes(formatValue(v)))
          : selectedValues.includes(formatValue(movieValue));
      });
    }
  });

  // Filter by selected keywords
  const selectedKeywords = Array.from(
    document.querySelectorAll('.keyword.selected')
  ).map((k) => k.textContent);
  if (selectedKeywords.length > 0) {
    filteredMovies = filteredMovies.filter(
      (movie) =>
        Array.isArray(movie.keywords) &&
        movie.keywords.some((keywordSet) =>
          keywordSet.split(',').some((k) => selectedKeywords.includes(k.trim()))
        )
    );
  }

  renderGallery(filteredMovies);
  document
    .querySelectorAll('.dropdown-list')
    .forEach((list) => list.classList.remove('show'));
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-dropdown')) {
    document
      .querySelectorAll('.dropdown-list')
      .forEach((list) => list.classList.remove('show'));
  }
});
