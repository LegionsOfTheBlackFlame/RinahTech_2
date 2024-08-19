async function setActiveLanguage(lang) {
    localStorage.setItem('lang', lang);
}
async function getActiveLanguage() {
    return Number(localStorage.getItem('lang')) || 0;
}
document.addEventListener('DOMContentLoaded', async ()=> {
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
    const mainContainer = document.getElementById('activity_main');
    try {
        const fetchResponse = await fetch(`/activities_content?lang=${activeLang}`);
        if (!fetchResponse.ok) {
            throw new Error('Network response was not ok ' + fetchResponse.statusText);
        };
        let fetchData = await fetchResponse.json();

        for (let i = 0; i < fetchData.length; i++) {
            let regex = /^paragraph\d*$/i;
            if (regex.test(fetchData[i].field)) {
                const thisParagraph = document.createElement('p');
                thisParagraph.innerText = fetchData[i].act_description;
                mainContainer.appendChild(thisParagraph);
            } else {
                console.log(regex, fetchData[i].field);
                const thisTitle = document.createElement('h3');
                thisTitle.innerText = fetchData[i].act_description;
                mainContainer.appendChild(thisTitle);
            }
        }
    } catch (error) {
        throw error
    }
})
