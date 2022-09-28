import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';

let page = 1;
let query = '';
let totalHits = 0;

let lightBox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const BASE_URL = 'https://pixabay.com/api/';

const searchParams = new URLSearchParams({
  key: '30193176-963107e0b52f3e6b90e541e40',
  q: '',
  lang: 'en',
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: 'true',
  page: 1,
  per_page: 40,
});

const form = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');
const toTopBtn = document.querySelector('.to-top');

form.addEventListener('submit', onFormSubmit);
loadMoreBtn.addEventListener('click', onLoadMoreClick);

toTopBtn.onclick = function scrollToTop() {
  window.scrollTo(0, 0);
};

async function onFormSubmit(event) {
  try {
    event.preventDefault();
    query = getQuery(event);
    if (!query) {
      return;
    }

    loadMoreBtn.classList.add('hidden');
    toTopBtn.classList.add('hidden');

    setStartPage();

    const data = await fetchQuery(query);

    if (data.hits.length === 0) {
      gallery.innerHTML = '';
      loadMoreBtn.classList.add('hidden');
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    totalHits = data.totalHits;

    clearGalleryMarkup();
    renderGalleryMarkup(data.hits);

    Notify.success(`Hooray! We found ${totalHits} images.`);
  } catch (error) {
    console.log(error.message);
  }
}

function getQuery(event) {
  return event.currentTarget.elements.searchQuery.value.trim();
}

async function fetchQuery(query) {
  searchParams.set('q', query);

  const url = `${BASE_URL}?${searchParams}`;

  const { data } = await axios.get(url);
  return data;
}

function clearGalleryMarkup() {
  gallery.innerHTML = '';
}

function renderGalleryMarkup(data) {
  const markup = data
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
      <div class="photo-card">
      <a class="gallery-item" href="${largeImageURL}">
  <img src="${webformatURL}" alt="${tags}" loading="lazy" />
  </a>
  <div class="info">
    <p class="info-item">
      <b>Likes: ${likes}</b>
    </p>
    <p class="info-item">
      <b>Views: ${views}</b>
    </p>
    <p class="info-item">
      <b>Comments: ${comments}</b>
    </p>
    <p class="info-item">
      <b>Downloads: ${downloads}</b>
    </p>
  </div>
</div>`
    )
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);
  lightBox.refresh();

  const finalPage = Math.ceil(totalHits / searchParams.get('per_page'));
  if (finalPage === page) {
    loadMoreBtn.classList.add('hidden');
    toTopBtn.classList.add('hidden');
    Notify.info(
      'We are sorry, but you have reached the end of search results.'
    );
    return;
  }

  loadMoreBtn.classList.remove('hidden');
  toTopBtn.classList.remove('hidden');
}

function pageIncrement() {
  page += 1;
}

function setStartPage() {
  page = 1;
  searchParams.set('page', page);
}

async function onLoadMoreClick() {
  try {
    pageIncrement();
    searchParams.set('page', page);
    const data = await fetchQuery(query);
    renderGalleryMarkup(data.hits);

    const { height: cardHeight } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();

    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });
  } catch (error) {
    console.log(error.message);
  }
}
