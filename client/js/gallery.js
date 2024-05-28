// Decodes chunks of data sent as Uint8Array
async function decodeChunks(chunk) {
    console.log("running decoder...");
    const decoder = new TextDecoder('utf-8');
    const decoded = decoder.decode(chunk);
    const thisArray = JSON.parse(decoded);
    return thisArray;
}

// Adds new items to the main array and sorts items based on date values descending
async function sortAndCombine(main, part, callback) {
    console.log("running sort and combine...");
    const combined = main.concat(part);
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    await callback(combined); // Use await to ensure the callback completes
}

async function filterMedia(state) {
    console.log("Filtering with filter:", state.Filter);
    if (state.Filter) {
        return state.Items.filter(item => item.item_type === state.Filter); // Make sure to use the correct key for filtering
    }
    return state.Items;
}

async function paginate(items, state) {
    const start = (state.PageDisplayed - 1) * state.ItemsPerPage;
    const end = start + state.ItemsPerPage;
    return items.slice(start, end);
}

function renderItems(items, elements) {
    elements.gallery.innerHTML = '';
    items.forEach((item, index) => { // Add index to track which item is clicked
        const div = document.createElement('div');
        const img = document.createElement('img');

        div.className = item.item_type + "ItemContainer";
        img.src = item.image_source;
        img.dataset.index = index; // Set dataset with the index of the item
        div.appendChild(img);
        elements.gallery.appendChild(div);

        // Add click event listener to each image
        img.addEventListener('click', () => {
            displayClickedItem(item);
        });
    });
}

async function paginateAndRender(state, elements) {
    const itemsToDisplay = await filterMedia(state);
    const paginatedItems = await paginate(itemsToDisplay, state);
    renderItems(paginatedItems, elements);
}

document.addEventListener('DOMContentLoaded', async function () {
    const domElements = {
        gallery: document.getElementById('gallery_container'),
        btnPrev: document.getElementById('btnIndicatorPrev'),
        btnNext: document.getElementById('btnIndicatorNext'),
        indicators: document.querySelectorAll('input[name="indicator"]'),
        btnFilters: document.getElementById('btnFilters'),
        contFilterOptions: document.getElementById('contFilterOptions'),
        filterOptionsRadioGroup: document.querySelectorAll('input[name="radioFilterOptions"]')
    };

    const state = {
        Items: [],
        ToBeDisplayed: [],
        Filter: '', // Ensure Filter is initialized
        ItemsPerPage: 25,
        PageDisplayed: 1
    };

    const callbackSortAndCombine = async (updatedMediaList) => {
        state.Items = [...updatedMediaList];
        await paginateAndRender(state, domElements);
    };

    const response = await fetch("/fetch_media");

    for await (const chunk of response.body) {
        const arrayPart = await decodeChunks(chunk);
        await sortAndCombine(state.Items, arrayPart, callbackSortAndCombine);
    }

    // Handles media filtration
    domElements.filterOptionsRadioGroup.forEach(radio => {
        radio.addEventListener('click', (e) => {
            state.Filter = e.target.value;
            console.log("Filter selected:", state.Filter);
            paginateAndRender(state, domElements);
        });
    });

    // Show/Hide filter options 
    let isHidden = true;
    domElements.btnFilters.addEventListener('click', function () {
        if (isHidden) {
            domElements.contFilterOptions.classList.remove('hidden');
        } else {
            domElements.contFilterOptions.classList.add('hidden');
        }
        isHidden = !isHidden;
    });

    // Page buttons and indicator
    let selectedIndicator = Array.from(domElements.indicators).findIndex(ind => ind.checked);

    domElements.btnNext.addEventListener('click', function () {
        if (selectedIndicator == domElements.indicators.length - 1) {
            return;
        }
        selectedIndicator++;
        domElements.indicators[selectedIndicator].checked = true;
        state.PageDisplayed++;
        paginateAndRender(state, domElements);
    });

    domElements.btnPrev.addEventListener('click', function () {
        if (selectedIndicator == 0) {
            return;
        }
        selectedIndicator--;
        domElements.indicators[selectedIndicator].checked = true;
        state.PageDisplayed--;
        paginateAndRender(state, domElements);
    });
});
