async function decodeChunks(chunk) {
    const decoder = new TextDecoder('utf-8');
    const decoded = decoder.decode(chunk);
    return decoded.split('\n').filter(Boolean).map(JSON.parse); // Split by newline, filter out empty strings, and parse each chunk
}

async function sortAndCombine(main, part, callback) {
    const combined = main.concat(part);
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    await callback(combined);
}

async function filterMedia(StateVariables) {
    const state = StateVariables.state;
    if (state.Filter) {
        return state.Items.filter(item => item.item_type === state.Filter);
    }
    return state.Items;
}

async function paginate(items, StateVariables) {
    const state = StateVariables.state;
    if (state.SelectedItemIndex !== null) {
        const start = Math.max(0, state.SelectedItemIndex - 2);
        const end = Math.min(items.length, state.SelectedItemIndex + 3);
        return items.slice(start, end);
    } else {
        const start = (state.PageDisplayed - 1) * state.ItemsPerPage;
        const end = start + state.ItemsPerPage;
        return items.slice(start, end);
    }
}

function renderItems(items, StateVariables) {
    const elements = StateVariables;
    elements.gallery.innerHTML = '';

    const processedItems = new Set();

    items.forEach((item, index) => {
        if (!processedItems.has(item.image_source)) {
            processedItems.add(item.image_source);

            const div = document.createElement('div');
            const img = new Image();

            div.className = item.item_type + "ItemContainer";
            img.src = item.image_source;
            img.dataset.index = index;
            div.appendChild(img);
            elements.gallery.appendChild(div);

            img.addEventListener('click', () => {
                displayClickedItem(item, index, StateVariables);
            });
            img.addEventListener("load", (e) => {
                if (e.target.height === 0) return;
                else if (e.target.height <= 360) {
                    div.classList.add('small');
                } else if (360 < e.target.height <= 1000) {
                    div.classList.add('medium');
                } else {
                    div.classList.add('large');
                }
            });
        }
    });
}

function displayClickedItem(item, index, StateVariables) {
    const elements = StateVariables;
    elements.state.SelectedItemIndex = index;
    elements.itemDisplayContainer.innerHTML = `
        <div class="display">
            ${item.item_type === 'video' ? 
                `<iframe src="https://www.youtube.com/embed/${item.id}" class="video-item" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` :
                `<img src="${item.image_source}" alt="Selected Media">`}
                <button id="btnCloseDisplay" class="close-button">X</button>
            <button id="btnPrevItem" class="nav-button-prev">&lt;</button>
            <button id="btnNextItem" class="nav-button-next">&gt;</button>
        </div>
    `;
    elements.itemDisplayContainer.classList.remove('hidden');
    elements.gallery.classList.add('shrunk-gallery');
    elements.pageIndicators.classList.add('hidden');
    elements.btnPrev.classList.add('hidden');
    elements.btnNext.classList.add('hidden');

    document.getElementById('btnCloseDisplay').addEventListener('click', () => {
        elements.state.SelectedItemIndex = null;
        elements.itemDisplayContainer.innerHTML = '';
        elements.itemDisplayContainer.classList.add('hidden');
        elements.gallery.classList.remove('shrunk-gallery');
        elements.pageIndicators.classList.remove('hidden');
        elements.btnPrev.classList.remove('hidden');
        elements.btnNext.classList.remove('hidden');
        paginateAndRender(StateVariables);
    });

    document.getElementById('btnPrevItem').addEventListener('click', () => {
        const prevIndex = Math.max(0, index - 1);
        const prevItem = elements.state.Items[prevIndex];
        displayClickedItem(prevItem, prevIndex, StateVariables);
    });

    document.getElementById('btnNextItem').addEventListener('click', () => {
        const nextIndex = Math.min(elements.state.Items.length - 1, index + 1);
        const nextItem = elements.state.Items[nextIndex];
        displayClickedItem(nextItem, nextIndex, StateVariables);
    });

    paginateAndRender(StateVariables);
}

function createPageIndicators(StateVariables) {
    const elements = StateVariables;
    const indicatorContainer = elements.indicatorContainer;
    indicatorContainer.innerHTML = '';

    const totalPages = Math.ceil(elements.state.Items.length / elements.state.ItemsPerPage);
    for (let i = 1; i <= totalPages; i++) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'indicator';
        radio.value = i;
        if (i === elements.state.PageDisplayed) {
            radio.checked = true;
        }
        radio.addEventListener('change', () => {
            elements.state.PageDisplayed = i;
            paginateAndRender(StateVariables);
        });
        indicatorContainer.appendChild(radio);
    }
}

async function paginateAndRender(StateVariables) {
    const itemsToDisplay = await filterMedia(StateVariables);
    const paginatedItems = await paginate(itemsToDisplay, StateVariables);
    renderItems(paginatedItems, StateVariables);

    createPageIndicators(StateVariables);

    const elements = StateVariables;
    elements.btnPrev.style.display = elements.state.PageDisplayed === 1 ? 'none' : 'block';
    elements.btnNext.style.display = elements.state.PageDisplayed === Math.ceil(elements.state.Items.length / elements.state.ItemsPerPage) ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', async function () {
    const StateVariables = {
        gallery: document.getElementById('gallery_container'),
        btnPrev: document.getElementById('btnIndicatorPrev'),
        btnNext: document.getElementById('btnIndicatorNext'),
        indicatorContainer: document.getElementById('indicatorContainer'),
        btnFilters: document.getElementById('btnFilters'),
        contFilterOptions: document.getElementById('contFilterOptions'),
        filterOptionsRadioGroup: document.querySelectorAll('input[name="radioFilterOptions"]'),
        itemDisplayContainer: document.getElementById('item-display-container'),
        pageIndicators: document.querySelector('.page-indicators'),
        state: {
            Items: [],
            ToBeDisplayed: [],
            Filter: '',
            ItemsPerPage: 25,
            PageDisplayed: 1,
            SelectedItemIndex: null
        }
    };

    const callbackSortAndCombine = async (updatedMediaList) => {
        StateVariables.state.Items = [...updatedMediaList];
        await paginateAndRender(StateVariables);
    };

    const response = await fetch("/fetch_media");
    const reader = response.body.getReader();
    let partialChunk = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialChunk += new TextDecoder('utf-8').decode(value);
        const chunks = partialChunk.split('\n');
        partialChunk = chunks.pop(); // Keep the last chunk as it might be incomplete

        for (const chunk of chunks) {
            const arrayPart = JSON.parse(chunk);
            await sortAndCombine(StateVariables.state.Items, arrayPart, callbackSortAndCombine);
        }
    }

    StateVariables.filterOptionsRadioGroup.forEach(radio => {
        radio.addEventListener('click', (e) => {
            StateVariables.state.Filter = e.target.value;
            paginateAndRender(StateVariables);
        });
    });

    let isHidden = true;
    StateVariables.btnFilters.addEventListener('click', function () {
        StateVariables.contFilterOptions.classList.toggle('hidden');
        isHidden = !isHidden;
    });

    StateVariables.btnNext.addEventListener('click', function () {
        if (StateVariables.state.PageDisplayed < Math.ceil(StateVariables.state.Items.length / StateVariables.state.ItemsPerPage)) {
            StateVariables.state.PageDisplayed++;
            paginateAndRender(StateVariables);
        }
    });

    StateVariables.btnPrev.addEventListener('click', function () {
        if (StateVariables.state.PageDisplayed > 1) {
            StateVariables.state.PageDisplayed--;
            paginateAndRender(StateVariables);
        }
    });
});
