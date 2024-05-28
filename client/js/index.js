document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetch('/fetch_tokens_from_database');
        const reviewsFetchResponse = await fetch('/google_reviews');
        if (!reviewsFetchResponse.ok) {
            throw new Error('Network response was not ok ' + reviewsFetchResponse.statusText);
        }
        let reviews = await reviewsFetchResponse.json();
        console.log("Fetched reviews: ", reviews);

        // Filter out reviews with no Original_text
        reviews = reviews.filter(review => review.Original_text && review.Original_text.trim().length > 0);

        let currentIndex = 0;

        function renderReviews() {
            const profilesContainer = document.getElementById('profiles-container');
            const reviewerName = document.getElementById('reviewer-name');
            const reviewText = document.getElementById('review-text');
            const ratingStars = document.getElementById('rating-stars');
            
            profilesContainer.innerHTML = '';
            ratingStars.innerHTML = '';

            for (let i = 0; i < 11; i++) {
                const reviewIndex = (currentIndex + i) % reviews.length;
                const review = reviews[reviewIndex];
                const img = document.createElement('img');
                img.src = `/proxy?url=${encodeURIComponent(review.User_image_url)}`;
                img.classList.add('profile');
                if (i === 5) {
                    img.classList.add('active');
                    reviewText.textContent = review.Original_text;
                    reviewerName.textContent = review.User_name;
                    // Render rating stars
                    for (let j = 0; j < 5; j++) {
                        const star = document.createElement('span');
                        star.classList.add('star');
                        star.textContent = j < review.Score ? '★' : '☆';
                        ratingStars.appendChild(star);
                    }
                }
                profilesContainer.appendChild(img);
            }
        }

        function rotateReviews() {
            currentIndex = (currentIndex + 1) % reviews.length;
            renderReviews();
        }

        renderReviews();
        setInterval(rotateReviews, 2000); // Change review every 10 seconds
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }

    try {

        const fetchedData = await fetch('/service_cards_content');
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        let cardsContent = await fetchedData.json();

        cardsContent.forEach((service, index) => {
            const card = document.getElementById(`service-card${index + 1}`);
            const imgDiv = card.querySelector('.service-img');
            const title = card.querySelector('.service-info h3');
            const description = card.querySelector('.service-info p');

            imgDiv.style.backgroundImage = `url(${service.media_url})`;
            title.textContent = service.service_card_title;
            description.textContent = service.service_card_content;
        });

    } catch (error) { throw error}

    try {
        const hero = document.getElementsByClassName('hero-text');
        const fetchedData = await fetch('/hero_content');
        if (!fetchedData.ok) {
            throw new Error('Network response was not ok ' + fetchedData.statusText);
        }
        let heroContent = await fetchedData.json();
        const heroTitle = hero.querySelector('h1');
        const heroText = hero.querySelector('p');
        heroTitle.textContent = heroContent[0].content;
        heroText.textContent = heroContent[1].content;
    } catch (error) {throw error}
});
