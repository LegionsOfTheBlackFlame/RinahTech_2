async function setActiveLanguage(lang) {
    localStorage.setItem('lang', lang);
}
async function getActiveLanguage() {
    return Number(localStorage.getItem('lang')) || 0;
}

document.addEventListener("DOMContentLoaded", async () => {
    const mainContainer = document.getElementById("orgs_main");
    const languagePicker = document.getElementById('lang_picker');
    let activeLang = await getActiveLanguage();
    languagePicker.value = activeLang;
    languagePicker.addEventListener('change', async (event) => {
        const langValue = event.target.value;
        await setActiveLanguage(langValue);
        activeLang = await getActiveLanguage();
        location.reload();
        console.log("language changed ", activeLang);
    });
    try {
        const response = await fetch(`/orgs_content?lang=${activeLang}`);
        const data = await response.json();
        const orgs = {};

        data.forEach(point => {
            const { org_name, org_item_role, org_item_content } = point;
            if (!orgs[org_name]) {
                orgs[org_name] = [];
            }
            orgs[org_name].push([org_item_role, org_item_content]);
        });

        for (const [org, roles] of Object.entries(orgs)) {
            const orgContainer = document.createElement('div');
            const orgHeader = document.createElement('h1');
            orgHeader.innerText = org;
            orgContainer.appendChild(orgHeader);

            const ul = document.createElement('ul');
            roles.forEach(([role, content]) => {
                const li = document.createElement('li');
                li.textContent = `${role}: ${content}`;
                ul.appendChild(li);
            });

            orgContainer.appendChild(ul);
            mainContainer.appendChild(orgContainer);
        }
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
});
