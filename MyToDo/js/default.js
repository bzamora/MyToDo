(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            args.setPromise(WinJS.UI.processAll().then(function () {
                initializeDb().done(function () {
                    initializeUI();
                });
            }));
        }
    };

    app.start();

    function initializeDb() {
        return new WinJS.Promise(function (completed, error, progress) {
            MyToDo.data.init(function () {
                completed();
            });
        });
    }

    function initializeUI() {
        var viewModel = new ViewModel();
        viewModel.init();

        document.getElementById("addForm").addEventListener("submit", viewModel.submitAdd, false);
        document.getElementById("editForm").addEventListener("submit", viewModel.submitEdit, false);
        document.getElementById("deleteCommand").addEventListener("click", viewModel.deleteToDo, false);
        document.getElementById("editCommand").addEventListener("click", viewModel.editToDo, false);
        document.getElementById("searchInput").addEventListener("keyup", viewModel.search, false);
        document.querySelector("#editForm .cancel").addEventListener("click", viewModel.cancelEdit, false);
    }

    function ViewModel() {
        var
            listView = document.getElementById("toDoList").winControl,
            appBar = document.getElementById("appBar").winControl,
            editFlyout = document.getElementById("editFlyout").winControl,
            addForm = document.getElementById("addForm"),
            editForm = document.getElementById("editForm"),
            self = this,
            dataList;

        this.init = function () {
            MyToDo.toDoList.getList(function (e) {
                dataList = new WinJS.Binding.List(e);

                listView.itemDataSource = dataList.dataSource;
                listView.onselectionchanged = self.selectionChanged;
            });
        };

        this.search = function () {
            delay(function () {
                var searchValue = document.getElementById("searchInput").value;

                MyToDo.toDoList.search(searchValue, function (e) {
                    dataList = new WinJS.Binding.List(e);
                    listView.itemDataSource = dataList.dataSource;
                });
            }, 500);
        };

        var delay = (function () {
            var timer = 0;
            return function (callback, ms) {
                clearTimeout(timer);
                timer = setTimeout(callback, ms);
            };
        })();

        this.selectionChanged = function (args) {
            var
                selectionCount = listView.selection.count(),
                selectionCommands = document.querySelectorAll(".appBarSelection"),
                singleSelectionCommands = document.querySelectorAll(".appBarSingleSelection");

            if (selectionCount > 0) {
                appBar.showCommands(selectionCommands);

                if (selectionCount > 1) {
                    appBar.hideCommands(singleSelectionCommands);
                }

                appBar.sticky = true;
                appBar.show();
            }
            else {
                appBar.hideCommands(selectionCommands);

                appBar.sticky = false;
                appBar.hide();
            }
        };

        this.deleteToDo = function () {
            var dialog = new Windows.UI.Popups.MessageDialog("Are you sure you want to delete?");

            dialog.commands.append(new Windows.UI.Popups.UICommand("OK", function (command) {
                var selectionCount = listView.selection.count();
                if (selectionCount > 0) {
                    listView.selection.getItems().then(function (items) {
                        items.forEach(function (item) {
                            var
                                dbKey = item.data.id,
                                lvKey = item.key;

                            MyToDo.toDoList.remove(dbKey, function () {
                                listView.itemDataSource.remove(lvKey);
                            });
                        });
                    });
                }
            }));

            dialog.commands.append(new Windows.UI.Popups.UICommand("Cancel", null));

            dialog.defaultCommandIndex = 1;
            dialog.cancelCommandIndex = 1;

            dialog.showAsync();
        };

        this.editToDo = function () {
            var
                anchor = document.querySelector(".toDo"),
                selectionCount = listView.selection.count();

            if (selectionCount === 1) {
                listView.selection.getItems().then(function (items) {
                    var
                        item = items[0],
                        editFlyoutElement = document.getElementById("editFlyout");

                    var toDo = {
                        id: item.data.id,
                        name: item.data.name,
                        description: item.data.description,
                        lvIndex: item.index
                    };

                    var process = WinJS.Binding.processAll(editFlyoutElement, toDo);

                    process.then(function () {
                        editFlyout.show(anchor, "top", "center");
                    });
                });
            }
        };

        this.submitAdd = function (e) {
            e.preventDefault();

            var toDo = {
                name: document.querySelector("#addForm .name").value,
                description: document.querySelector("#addForm .description").value
            };

            MyToDo.toDoList.add(toDo, function (e) {
                dataList.push(e);

                addForm.reset();
            });
        };

        this.submitEdit = function (e) {
            e.preventDefault();

            var toDo = {
                id: document.querySelector("#editForm .id").value,
                name: document.querySelector("#editForm .name").value,
                description: document.querySelector("#editForm .description").value,
                lvIndex: document.querySelector("#editForm .lvIndex").value
            };

            MyToDo.toDoList.update(toDo, function (e) {
                editFlyout.hide();
                appBar.hide();
                editForm.reset();
                listView.selection.clear();

                dataList.setAt(toDo.lvIndex, toDo);
            });
        };

        this.cancelEdit = function (e) {
            e.preventDefault();

            editFlyout.hide();
            appBar.hide();
            editForm.reset();
            listView.selection.clear();
        };
    }

})();
