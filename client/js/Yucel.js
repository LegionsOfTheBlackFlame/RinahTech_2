document.addEventListener('DOMContentLoaded', async () => {

try {
    const fetchedData = await fetch('/team_yucel_content');
    if (!fetchedData.ok) {
        throw new Error('Network response was not ok ' + fetchedData.statusText);
    } 
    const teamContent = await fetchedData.json();
    const contentContainer = document.getElementById('main_container');

    const title = teamContent.find(item => item.field === "name");
    if (title) {
        const heroTitle = document.createElement('h1');
        heroTitle.innerHTML = title.content;
        contentContainer.appendChild(heroTitle);
    }

    const roles = teamContent.find(item => item.field === "role");

    roles.forEach(element => {
        const roleP = document.createElement("p");
        roleP.innerHTML = element.content;
        contentContainer.appendChild(roleP);
        
    });

    const history = teamContent.find(item => item.field === "history");
    history.forEach(item => {
        const historyP = document.createElement('p');
        historyP.innerHTML = item.content;
        contentContainer.appendChild(historyP);
    });


} catch (error) {
    throw error
}

})