document.addEventListener('DOMContentLoaded', async ()=> {
    const mainContainer = document.getElementById('activity_main');
    try {
        const fetchResponse = await fetch('/activities_content');
        if (!fetchResponse.ok) {
            throw new Error('Network response was not ok ' + fetchResponse.statusText);
        };
        let fetchData = await fetchResponse.json();

        for (let i = 0; i < fetchData.length; i++) {
            let regex = /^paragraph\d*$/i;
            if (regex.test(fetchData[i].act_name)) {
                const thisParagraph = document.createElement('p');
                thisParagraph.innerText = fetchData[i].act_description;
                mainContainer.appendChild(thisParagraph);
            } else {
                console.log(regex, fetchData[i].act_name);
                const thisTitle = document.createElement('h3');
                thisTitle.innerText = fetchData[i].act_description;
                mainContainer.appendChild(thisTitle);
            }
        }
    } catch (error) {
        throw error
    }
})
