document.addEventListener("DOMContentLoaded", () => {

    const urlParams = new URLSearchParams(window.location.search);
    const githubUsername = urlParams.get('username');


    const reposPerPage = 10;
    let currentPage = 1;
    let currentSet = 1;
    let totalPages;
    let totalRepos;
    let totalSets;

    function hideLoader() {
        const loader = document.getElementById("loader");
        loader.style.display = "none";
    }

    function showContent() {
        const element = document.getElementById("content");
        element.classList.remove("hidden");
    }
    
    function fetchAndDisplayUser() {
        // Fetch user details from GitHub API
        const userPromise = new Promise((resolve) => {
            $.getJSON(`https://api.github.com/users/${githubUsername}`, function (user) {
                // Update profile details
                $('#profilePic').attr('src', user.avatar_url);
                $('#profileLink').attr('href', user.html_url);
                $('#profileLink').html(`<i class="fa fa-link" aria-hidden="true"></i> ${user.html_url}`);
                $('#userName').text(user.name || user.login);
                $('#userBio').text(user.bio || 'No bio available');
                $('#userLocation').html(`<i class="fa-solid fa-location-dot"></i> ${user.location || 'Not specified'}`);
                $('#userTwitter').html(`<i class="fa-brands fa-twitter"></i> ${user.twitter_username || 'Not specified'}`);
                totalRepos = user.public_repos;
                totalSets = Math.ceil(totalRepos/100);
                console.log('totalRepos: ', totalRepos)
                resolve(); // Resolve the promise when user details are fetched
            });
        });

        // Fetch and display repositories for the current page
        const reposPromise = fetchAndDisplayRepos();

        // Wait for both promises to complete before hiding the loader
        Promise.all([userPromise, reposPromise])
            .then(() => {
                hideLoader();
                showContent();
            });
    }

    function fetchAndDisplayRepos() {
        
        const startIndex = (currentPage - 1) * reposPerPage;
        const endIndex = startIndex + reposPerPage;

        // Fetch user's repositories from GitHub API using the per_page & page query string
        return new Promise((resolve) => {
            $.getJSON(`https://api.github.com/users/${githubUsername}/repos?per_page=100&page=${currentSet}`, function (repos) {
                const repoList = $('#repoList');
                repoList.empty(); // Clear existing content

                // Display repositories for the current page
                const currentRepos = repos.slice(startIndex, endIndex);
                const requests = currentRepos.map(repo => {
                    return new Promise(innerResolve => {
                        $.getJSON(repo.languages_url, function (languages) {
                            const repoItem = `<div class="repoItem p-2 m-4">
                                <a href="${repo.html_url}" target="_blank" class="repoName my-2">${repo.name}  <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                                <p class="my-2"> ${repo.description ? repo.description.slice(0,128)+(repo.description.length>128 ? ' . . .' : '') : 'No Description'}  </p>
                                <div class="languageList">
                                    ${Object.keys(languages).map(language => `<div class="languageItem">${language}</div>`).join('\n')}
                                </div>
                            </div>`;
                            repoList.append(repoItem);
                            innerResolve();
                        });
                    });
                });

                // Update pagination controls
                updatePagination();

                // Resolve the outer promise when all requests are complete
                Promise.all(requests).then(() => {
                    resolve();
                });
            });
        });
    }


    window.goToPage = function(page) {
        currentPage = page===10 ? 10 : page%10;
        fetchAndDisplayRepos();
    };    

    function updatePagination() {
        totalPages = Math.ceil(totalRepos / reposPerPage);


        //for updating page buttons 
        const paginationButtons= $('#pagination .pageBtn');
        paginationButtons.empty(); 

        if (currentPage === 1) {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="prevPage()" disabled><<</button>`);
        } else {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="prevPage()"><<</button>`);
        }
    
        const startPage = (currentSet - 1) * 10 + 1;
        const endPage = Math.min(currentSet * 10, totalPages);
    
        for (let i = startPage; i <= endPage; i++) {
            const button = $(`<button class="btn" onclick="goToPage(${i})">${i}</button>`);
            if (i === (10*(currentSet-1)+currentPage)) {
                button.addClass('btn-secondary');
            }
            paginationButtons.append(button);
        }
    
        if ((currentSet === totalSets && currentPage === totalPages%10) || currentPage === 10) {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="nextPage()" disabled>>></button>`);
        } else {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="nextPage()">>></button>`);
        }

        //for updating oher page items 
        $('#pagination .pageOtherItems').html(`
                <button class="btn btn-secondary" ${currentSet === 1 ? 'disabled' : ''} onclick="prevSet()"><i class="fa-solid fa-arrow-left"></i> Older</button>
                <button class="btn btn-secondary" ${currentSet === totalSets ? 'disabled' : ''} onclick="nextSet()">Newer <i class="fa-solid fa-arrow-right"></i></button>`);
    }
    
    // Function to go to the previous set of buttons
    window.prevSet = function () {
        if (currentSet > 1) {
            currentSet = currentSet - 1;
            currentPage = 1;
            fetchAndDisplayRepos();
        }
    };

    // Function to go to the next set of buttons
    window.nextSet = function () {
        if (currentSet < totalSets) {
            currentSet = currentSet + 1;
            currentPage = 1;
            fetchAndDisplayRepos();
        }
    };
    
    // Function to go to the previous page
    window.prevPage = function () {
        if (currentPage > 1) {
            currentPage--;
            fetchAndDisplayRepos();
        }
    };

    // Function to go to the next page
    window.nextPage = function () {
        if(currentPage < 10){
            currentPage++;
            fetchAndDisplayRepos();
        }
    };

    // Initial fetch and display of user details
    fetchAndDisplayUser();
});
