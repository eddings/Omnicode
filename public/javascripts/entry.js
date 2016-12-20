class EntryController {
    constructor() {
        this.serverURL = 'https://labyrinth1.herokuapp.com';
        this.labURL = this.serverURL + '/lab';

        this.searchLabIDsCmd = 'searchLabIDs';

        this.searchBox = $('#labs');
        this.searchBoxFirstClicked = false;
        this.goBtn = $('#goBtn'); //ui-button ui-widget ui-corner-all

        this.labIDs = [];

        this.init();
    }

    init() {
        this.initializeLabIDs();
        this.addSearchBoxHandler();
        this.addGoBtnHandler();

        this.goBtn.attr('disabled', true);
    }

    initializeLabIDs() {
        var dataObj = {
            command: this.searchLabIDsCmd
        };
        $.post({
            url: this.labURL,
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
                    window.location.href = this.labURL + '/' + searchTerm;
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
            window.location.href = this.labURL + '/' + this.searchBox.val();
        });
    }
}

$(document).ready(function() {
    var ctrl = new EntryController();
});