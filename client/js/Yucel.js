document.addEventListener('DOMContentLoaded', async () => {
    const contentContainer = document.getElementById('main_container');
try {
    const fetchedData = await fetch('/team_mustafa_content');
    console.log(fetchedData);
    if (!fetchedData.ok) {
        throw new Error('Network response was not ok ' + fetchedData.statusText);
    } 
    const teamContent = await fetchedData.json();
    

    const title = teamContent.find(item => item.field === "name");
    if (title) {
        const heroTitle = document.createElement('h1');
        heroTitle.innerHTML = title.content;
        contentContainer.appendChild(heroTitle);
    }

    const roles = teamContent.filter(item => item.field === "role");
    const rolesContainer = document.createElement('div');
    rolesContainer.classList.add('roles-container');
    roles.forEach(element => {
        const roleP = document.createElement("p");
        roleP.innerHTML = element.content;
        rolesContainer.appendChild(roleP);
        
    });
    contentContainer.appendChild(rolesContainer);
    const history = teamContent.filter(item => item.field === "history");
    const historyContainer = document.createElement('div');
    historyContainer.classList.add('history-container');
    history.forEach(item => {
        const historyP = document.createElement('p');
        historyP.innerHTML = item.content;
        historyContainer.appendChild(historyP);
    });
    contentContainer.appendChild(historyContainer);


} catch (error) {
    throw error
}

})