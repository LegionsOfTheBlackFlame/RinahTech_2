document.addEventListener('DOMContentLoaded', () => {
    fetchDivingPoints();
});

async function fetchDivingPoints() {
    try {
        const response = await fetch('/locs_content'); 
        const data = await response.json();
        renderDivingPoints(data);
    } catch (error) {
        console.error('Error fetching diving points:', error);
    }
}

function renderDivingPoints(data) {
    const container = document.getElementById('locs_list_container');
    const regions = {};

   
    data.forEach(point => {
        const { loc_region, loc_name } = point;
        if (!regions[loc_region]) {
            regions[loc_region] = [];
        }
        regions[loc_region].push(loc_name);
    });

    
    for (const [region, names] of Object.entries(regions)) {
        const regionHeader = document.createElement('h2');
        const regionContainer = document.createElement('div');
        regionContainer.classList = "region-container";
        regionHeader.textContent = region;
        regionContainer.appendChild(regionHeader);
        container.appendChild(regionContainer);

        const ul = document.createElement('ul');
        names.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            ul.appendChild(li);
        });
        regionContainer.appendChild(ul);
    }
}
