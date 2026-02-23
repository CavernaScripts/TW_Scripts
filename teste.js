/*
 * Script Name: RedAlert's Scripts Pack
 * Version: v1.3.9
 * Last Updated: 2023-01-07
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2021-11-05
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'scriptsPack',
        name: `RedAlert's Scripts Pack`,
        version: 'v1.3.9',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/redalerts-scripts-pack.287832/',
    },
    translations: {
        en_DK: {
            "RedAlert's Scripts Pack": "RedAlert's Scripts Pack",
            Help: 'Help',
            'There was an error!': 'There was an error!',
            'There are no scripts!': 'There are no scripts!',
            'There has been an error fetching the scripts!':
                'There has been an error fetching the scripts!',
            'scripts listed': 'scripts listed',
            'Script Name': 'Script Name',
            'Script Loader': 'Script Loader',
            Forum: 'Forum',
            Demo: 'Demo',
            New: 'New',
            'Search scripts ...': 'Search scripts ...',
            'Fetching scripts ...': 'Fetching scripts ...',
            'Script is not allowed to be used on this TW market!':
                'Script is not allowed to be used on this TW market!',
            NEW: 'NEW',
            ALL: 'ALL',
            Add: 'Add',
            'Quick-bar item has been added!': 'Quick-bar item has been added!',
            'Go to forum': 'Go to forum',
            'View demo video': 'View demo video',
            'Add script on Quick-bar': 'Add script on Quick-bar',
            'This script has no demo video!': 'This script has no demo video!',
        },
    },
    allowedMarkets: ['en', 'us', 'yy', 'pt', 'fr', 'br', 'de'],
    allowedScreens: [],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidMarket = twSDK.checkValidMarket();

        // check if we are on a valid market
        if (!isValidMarket) {
            UI.ErrorMessage(
                twSDK.tt('Script is not allowed to be used on this TW market!')
            );
            return;
        }

        // Entry Point
        (async function () {
            try {
                const scripts = await fetchScripts();

                if (DEBUG) {
                    console.debug(`${scriptInfo} scripts`, scripts);
                }

                if (scripts.length) {
                    // build the user interface
                    buildUI(scripts);

                    // register event handlers
                    handleOnChangeSearchScripts(scripts);
                    handleFilterByCategory(scripts);
                    handleAddToQuickBar();
                    handleViewVideo();
                } else {
                    UI.ErrorMessage(twSDK.tt('There are no scripts!'));
                }
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('There was an error!'));
                console.error(`${scriptInfo} Error:`, error);
            }
        })();

        // Render: Build user interface
        function buildUI(scripts) {
            const content = prepareContent(scripts);

            const customStyle = `
                .ra-textarea { height: 45px; }
                .ra-external-icon-link { font-size: 16px; }
                .new-script-tag { background-color: #21881e; color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 3px; }

                .ra-table { border-spacing: 2px !important; border-collapse: separate !important; width: 100% !important; }
                .ra-table tr:nth-of-type(2n) td { background-color: #f0e2be }
                .ra-table tr:nth-of-type(2n+1) td { background-color: #fff5da; }

                .ra-input { font-size: 16px; padding: 10px; width: 100%; height: auto; line-height: 1; }

                .ra-donate-box { padding: 10px; border: 2px dashed red; font-size: 14px; text-align: center; }

                .ra-table-container { border: 1px solid #bc6e1f; }

                .ra-category-filter { padding: 4px 5px !important; display: inline-block; margin-bottom: 6px; }
            `;

            twSDK.renderBoxWidget(
                content,
                'raScriptsPack',
                'ra-scripts-pack',
                customStyle
            );
        }

        // Action Handler: On input change handler
        function handleOnChangeSearchScripts(scripts) {
            jQuery('#searchScripts').on('input', function (event) {
                const { value } = event.target;
                const remainingScripts = filterByValue(scripts, value.trim());
                if (remainingScripts.length) {
                    updateUIElements(remainingScripts);
                }

                handleViewVideo();
                handleAddToQuickBar();
            });
        }

        // Action Handler: Filter scripts by script category
        function handleFilterByCategory(scripts) {
            jQuery('.ra-category-filter').on('click', function (e) {
                e.preventDefault();

                jQuery('.ra-category-filter').removeClass('btn-confirm-yes');
                jQuery(this).addClass('btn-confirm-yes');

                const chosenCategory = jQuery(this)
                    .attr('data-category-filter')
                    .trim();

                if (chosenCategory !== 'new' && chosenCategory !== 'all') {
                    const filteredScripts = scripts.filter((script) => {
                        const { categories } = script;
                        return categories.includes(chosenCategory);
                    });

                    if (filteredScripts.length) {
                        updateUIElements(filteredScripts);
                    }
                } else {
                    if (chosenCategory === 'all') {
                        updateUIElements(scripts);
                    }
                    if (chosenCategory === 'new') {
                        const newScripts = getNewScripts(scripts);
                        updateUIElements(newScripts);
                    }
                }

                handleViewVideo();
                handleAddToQuickBar();
            });
        }

        // Action Handler: Add script to Quick-bar
        function handleAddToQuickBar() {
            jQuery('.add-to-quick-bar').on('click', function (e) {
                e.preventDefault();

                let selectedScript = jQuery(this)
                    .parent()
                    .parent()
                    .find('.ra-textarea')
                    .text()
                    .trim();
                let selectedScriptName = jQuery(this)
                    .parent()
                    .parent()
                    .find('.ra-script-title')
                    .attr('data-camelize')
                    .trim();

                let scriptData = `hotkey=&name=${selectedScriptName}&href=${encodeURI(
                    selectedScript
                )}`;
                let action =
                    '/game.php?screen=settings&mode=quickbar_edit&action=quickbar_edit&';

                jQuery.ajax({
                    url: action,
                    type: 'POST',
                    data: scriptData + `&h=${csrf_token}`,
                });
                UI.SuccessMessage(twSDK.tt('Quick-bar item has been added!'));
            });
        }

        // Action Handler: View video
        function handleViewVideo() {
            jQuery('.ra-view-video').on('click', function (e) {
                e.preventDefault();

                let selectedScriptVideo = jQuery(this).attr('href');
                selectedScriptVideo = selectedScriptVideo.split('=')[1];

                if (selectedScriptVideo) {
                    let content = `<iframe width="768" height="480" src="https://www.youtube-nocookie.com/embed/${selectedScriptVideo}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                    Dialog.show('content', content);
                } else {
                    UI.ErrorMessage(twSDK.tt('This script has no demo video!'));
                }
            });
        }

        // Helper: Convert string to camelCase
        function camelize(str) {
            return str
                .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
                    return index === 0
                        ? word.toLowerCase()
                        : word.toUpperCase();
                })
                .replace(/\s+/g, '');
        }

        // Helper: Update UI elements after user interaction
        function updateUIElements(scriptsArray) {
            const tableRows = buildTableRows(scriptsArray);
            jQuery('#raScriptsCount').text(scriptsArray.length);
            jQuery('#scriptsList').html(tableRows);
        }

        // Helper: Get new scripts
        function getNewScripts(scripts) {
            const newScripts = scripts.filter((script) => {
                const { date_published } = script;
                const approvedDate = Date.parse(date_published);
                if (isNewScriptCheck(approvedDate)) {
                    return script;
                }
            });

            return newScripts;
        }

        // Helper: Filter an array by value
        function filterByValue(arr = [], query = '') {
            const reg = new RegExp(query, 'i');
            return arr.filter((item) => {
                let flag = false;
                for (prop in item) {
                    if (reg.test(item[prop])) {
                        flag = true;
                    }
                }
                return flag;
            });
        }

        // Helper: Prepare the content
        function prepareContent(scripts) {
            const scriptCategories = buildScriptCategories(scripts);

            let content = `
                <div class="ra-mb15">
                    <input type="search" placeholder="${twSDK.tt(
                        'Search scripts ...'
                    )}" id="searchScripts" class="ra-input">
                </div>
                <div class="ra-mb15">
                    <p>
                        <b><span id="raScriptsCount">${
                            scripts.length
                        }</span> ${twSDK.tt('scripts listed')}</b>
                    </p>
                </div>
                <div class="ra-mb15">
                    ${scriptCategories}
                </div>
                <div class="ra-table-container ra-mb15">
                    <table class="ra-table vis" width="100%" id="scriptsTable">
                        <thead>
                            <tr>
                                <th width="70px">#</th>
                                <th class="ra-tal" width="36%">${twSDK.tt(
                                    'Script Name'
                                )}</th>
                                <th class="ra-tal" width="36%">${twSDK.tt(
                                    'Script Loader'
                                )}</th>
                                <th width="8%">${twSDK.tt('Forum')}</th>
                                <th width="8%">${twSDK.tt('Demo')}</th>
                                <th width="8%">${twSDK.tt('Add')}</th>
                            </tr>
                        </thead>
                        <tbody id="scriptsList">
                            ${buildTableRows(scripts)}
                        </tbody>
                    </table>
                </div>
                <div class="ra-donate-box">
                    <span>Do you like my scripts? You can support and <a href="https://www.buymeacoffee.com/twscripts" target="_blank" rel="noopener noreferrer">buy me a coffee</a>.</span>
                </div>
            `;

            return content;
        }

        // Helper: Build the script categories filter
        function buildScriptCategories(scripts) {
            const categories = getCategoriesList(scripts);
            const newScripts = getNewScripts(scripts);

            let categoriesFilterHtml = `
                <a href="javascript:void(0);" class="btn ra-category-filter ra-category-filter-all btn-confirm-yes" data-category-filter="all">
                    ${twSDK.tt('ALL')}
                </a>
                <a href="javascript:void(0);" class="btn ra-category-filter ra-category-filter-new" data-category-filter="new">
                    ${twSDK.tt('NEW')} (${newScripts.length})
                </a>
            `;

            categories.forEach((category) => {
                categoriesFilterHtml += `
                    <a href="javascript:void(0);" class="btn ra-category-filter" data-category-filter="${category}">
                        ${category}
                    </a>
                `;
            });

            return categoriesFilterHtml;
        }

        // Helper: Build table rows
        function buildTableRows(scripts) {
            let content = '';

            scripts.forEach((script, index) => {
                index++;
                const {
                    id,
                    title,
                    url,
                    script_loader,
                    help_link,
                    demo_video,
                    date_published,
                } = script;
                const approvedDate = Date.parse(date_published);
                const cleanTitle = twSDK.cleanString(title);

                content += `
                    <tr class="script-${id}" data-script-id="${id}" >
                        <td>
                            ${index}
                        </td>
                        <td class="ra-tal">
                            <a href="${url}" target="_blank" rel="noreferrer noopener" data-camelize="${camelize(
                    cleanTitle
                )}" title="${cleanTitle}" class="ra-script-title">
                                ${cleanTitle} ${isNewScriptCheck(approvedDate)}
                            </a>
                        </td>
                        <td class="ra-tal">
                            <textarea readonly class="ra-textarea">${script_loader.trim()}</textarea>
                        </td>
                        <td>
                            <a href="${help_link}" target="_blank" rel="noreferrer noopener" class="ra-external-icon-link" title="${twSDK.tt(
                    'Go to forum'
                )}">
                                ðŸ“œ
                            </a>
                        </td>
                        <td>
                            <a href="${demo_video}" target="_blank" rel="noreferrer noopener" class="ra-external-icon-link ra-view-video" title="${twSDK.tt(
                    'View demo video'
                )}">
                                ðŸŽ¬
                            </a>
                        </td>
                        <td>
                            <a href="javascript:void(0);" class="add-to-quick-bar" data-script-id="${id}"  title="${twSDK.tt(
                    'Add script on Quick-bar'
                )}">
                                âž•
                            </a>
                        </td>
                    </tr>
                `;
            });

            return content;
        }

        // Helper: Calculate if the script is a new one
        function isNewScriptCheck(date, returnType = 'html') {
            const today = new Date().getTime();
            const timeframe = 60 * 60 * 24 * 14; // 14 Days
            const deltaTime = (today - date) / 1000;
            if (deltaTime <= timeframe) {
                if (returnType === 'html') {
                    return `<span class="new-script-tag">${twSDK.tt(
                        'New'
                    )}</span>`;
                } else {
                    return true;
                }
            } else {
                return '';
            }
        }

        // Helper: Get scripts categories list from scripts
        function getCategoriesList(scripts) {
            let categories = scripts.map((script) => {
                return script.categories.split(', ');
            });
            categories = categories.flat();
            categories = [...new Set(categories)];
            return categories.sort();
        }

        // Helper: Fetch all required world data
        async function fetchScripts() {
            try {
                UI.InfoMessage(twSDK.tt('Fetching scripts ...'));
                const response = await jQuery.get(
                    'https://twscripts.dev/api/fetch-scripts/'
                );
                return JSON.parse(response);
            } catch (error) {
                UI.ErrorMessage(
                    twSDK.tt('There has been an error fetching the scripts!')
                );
                console.error(`${scriptInfo} Error:`, error);
            }
        }
    }
);
