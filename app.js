$(document).ready(function () {
    //Get username from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const githubUsername = urlParams.get('username');

    const reposPerPage = 10;
    let currentPage = 1;
    let currentSet = 1;
    let totalPages;
    let totalRepos;
    let totalSets;

    //Function for hiding loader function
    function hideLoader() {
        $('#loader').hide();
    }

    //Function for displaying 'Details' section
    function showContent() {
        $('#content').removeClass('hidden');
    }

    //Function used to fetch user details
    function fetchAndDisplayUser() {
        const userPromise = new Promise((resolve, reject) => {
            $.getJSON(`https://api.github.com/users/${githubUsername}`)
                .done(function (user) {
                    $('#profilePic').attr('src', user.avatar_url);
                    $('#profileLink').attr('href', user.html_url);
                    $('#profileLink').html(`<i class="fa fa-link" aria-hidden="true"></i> ${user.html_url}`);
                    $('#userName').text(user.name || user.login);
                    $('#userBio').text(user.bio || 'No bio available');
                    $('#userLocation').html(`<i class="fa-solid fa-location-dot"></i> ${user.location || 'Not specified'}`);
                    $('#userTwitter').html(`<i class="fa-brands fa-twitter"></i> ${user.twitter_username || 'Not specified'}`);
                    totalRepos = user.public_repos;
                    totalSets = Math.ceil(totalRepos / 100);
                    console.log('totalRepos: ', totalRepos);
                    resolve();
                })
                .fail(function (jqXHR) {
                    if (jqXHR.status === 404) {
                        alert(`User with name "${githubUsername}" not found!`);
                    } else if (jqXHR.status === 403) {
                        alert('API rate limit exceeded! Please try again later.');
                    }
                    reject();
                    window.location.href = 'index.html';
                });
        });

        const reposPromise = fetchAndDisplayRepos();

        Promise.all([userPromise, reposPromise])
            .then(() => {
                hideLoader();
                showContent();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    //Function to fetch Repositories from the API by using per_page queries
    function fetchAndDisplayRepos() {
        const startIndex = (currentPage - 1) * reposPerPage;
        const endIndex = startIndex + reposPerPage;

        return new Promise((resolve) => {
            $.getJSON(`https://api.github.com/users/${githubUsername}/repos?per_page=100&page=${currentSet}`)
                .done(function (repos) {
                    const repoList = $('#repoList');
                    repoList.empty();

                    const currentRepos = repos.slice(startIndex, endIndex);
                    const requests = currentRepos.map(repo => {
                        return new Promise(innerResolve => {
                            $.getJSON(repo.languages_url, function (languages) {
                                const repoItem = `<div class="repoItem p-2 m-4">
                                    <a href="${repo.html_url}" target="_blank" class="repoName my-2">${repo.name}  <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                                    <p class="my-2"> ${repo.description ? repo.description.slice(0, 128) + (repo.description.length > 128 ? ' . . .' : '') : 'No Description'}  </p>
                                    <div class="languageList">
                                        ${Object.keys(languages).map(language => `<div class="languageItem">${language}</div>`).join('\n')}
                                    </div>
                                </div>`;
                                repoList.append(repoItem);
                                innerResolve();
                            });
                        });
                    });

                    updatePagination();

                    Promise.all(requests).then(() => {
                        resolve();
                    });
                })
                .fail(function (err) {
                    console.log(err);
                });
        });
    }

    //Function to navigate between pages 
    window.goToPage = function (page) {
        currentPage = page === 10 ? 10 : page % 10;
        fetchAndDisplayRepos();
    };

    //Function to update the pagination block 
    function updatePagination() {
        totalPages = Math.ceil(totalRepos / reposPerPage);

        const paginationButtons = $('#pagination .pageBtn');
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
            if (i === (10 * (currentSet - 1) + currentPage)) {
                button.addClass('btn-secondary');
            }
            paginationButtons.append(button);
        }

        if ((currentSet === totalSets && currentPage === totalPages % 10) || currentPage === 10) {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="nextPage()" disabled>>></button>`);
        } else {
            paginationButtons.append(`<button class="btn btn-secondary" onclick="nextPage()">>></button>`);
        }

        $('#pagination .pageOtherItems').html(`
            <button class="btn btn-secondary" ${currentSet === 1 ? 'disabled' : ''} onclick="prevSet()"><i class="fa-solid fa-arrow-left"></i> Older</button>
            <button class="btn btn-secondary" ${currentSet === totalSets ? 'disabled' : ''} onclick="nextSet()">Newer <i class="fa-solid fa-arrow-right"></i></button>`);
    }

    //Function to navigate to previous set of pages
    window.prevSet = function () {
        if (currentSet > 1) {
            currentSet = currentSet - 1;
            currentPage = 1;
            fetchAndDisplayRepos();
        }
    };

    //Function to navigate to next set of pages
    window.nextSet = function () {
        if (currentSet < totalSets) {
            currentSet = currentSet + 1;
            currentPage = 1;
            fetchAndDisplayRepos();
        }
    };

    //Function to navigate to previous page
    window.prevPage = function () {
        if (currentPage > 1) {
            currentPage--;
            fetchAndDisplayRepos();
        }
    };

    //Function to navigate to next page
    window.nextPage = function () {
        if (currentPage < 10) {
            currentPage++;
            fetchAndDisplayRepos();
        }
    };

    fetchAndDisplayUser();
});