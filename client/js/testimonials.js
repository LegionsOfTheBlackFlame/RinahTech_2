const testData = [
    {pp: "client/images/users/1.jpg"},
    {pp: "../images/users/2.jpg"},
    {pp: "../images/users/3.jpg"},
    {pp: "../images/users/4.jpg"}
]

function testFunction() {
    const container = document.getElementById('sect4');
    const generatedElements = [];

    testData.forEach(user => {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'user-div';
        profileDiv.style.backgroundImage = `url('${user.pp}')`;

        container.appendChild(profileDiv);
    })
    
}

testFunction();