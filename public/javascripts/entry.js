class EntryController {
    constructor() {
        this.searchBox = $('#labs');
        this.searchBoxFirstClicked = false;
        this.goBtn = $('#goBtn'); //ui-button ui-widget ui-corner-all
        this.createLabLink = $('#create-lab-link');

        this.labIDs = [];

        this.init();
    }

    init() {
        this.initializeLabIDs();
        this.addSearchBoxHandler();
        this.addGoBtnHandler();
        this.addCreateLabLinkHandler();

        this.goBtn.attr('disabled', true);
    }

    initializeLabIDs() {
        var dataObj = {
            command: SEARCH_LAB_IDS_COMMAND
        };
        $.post({
            url: LAB_URL,
            data: JSON.stringify(dataObj),
            success: (data) => {
                this.labIDs = data.labIDs;
                this.searchBox.autocomplete({
                    source: data.labIDs
                });
            },
            error: (req, status, err) => {
                console.log(err);
            },
            dataType: 'json',
            contentType: 'application/json'
        });
    }

    addSearchBoxHandler() {
        this.searchBox.on('keyup', (e) => {
            var searchTerm = this.searchBox.val();

            if (this.labIDs.includes(searchTerm)) {
                if (e.keyCode === 13) { // Enter key detected
                    window.location.href = LAB_URL + '/' + searchTerm;
                }
                this.goBtn.attr('disabled', false);
            } else {
                this.goBtn.attr('disabled', true);
            }
        });

        this.searchBox.on('click', (e) => {
            if (!this.searchBoxFirstClicked) {
                this.searchBox.val('');
                this.searchBoxFirstClicked = true;
                this.searchBox.css('color', 'rgb(0,0,0);');  
            }
        });
    }

    addGoBtnHandler() {
        this.goBtn.on('click', (e) => {
            window.location.href = LAB_URL + '/' + this.searchBox.val();
        });
    }

    addCreateLabLinkHandler() {
        this.createLabLink.on('click', (e) => {
            e.preventDefault();
            window.location.href = '/author';
        });
    }
}

$(document).ready(function() {
    var ctrl = new EntryController();
});