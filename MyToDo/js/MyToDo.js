var MyToDo = MyToDo || {};

(function (MyToDo) {
    "use strict";

    MyToDo.data = (function () {
        var indexedDB = window.indexedDB;

        var init = function (success) {
            var request = indexedDB.open("MyToDo", 1);

            request.onsuccess = function () {
                MyToDo.data.db = request.result;
                success();
            };

            request.onerror = function (event) {
                console.log(event);
            };

            request.onblocked = function (event) {
                console.log(event);
            };

            request.onupgradeneeded = function (e) {
                var db = e.target.result;

                var toDoStore = db.createObjectStore("toDos", {
                    keyPath: "id",
                    autoIncrement: true
                });

                toDoStore.createIndex("name", "name", {
                    unique: false
                });
            };
        };

        return {
            init: init
        };

    })();

    MyToDo.toDoList = (function () {

        var getList = function (success) {
            var
                list = [],
                transaction = MyToDo.data.db.transaction("toDos"),
                store = transaction.objectStore("toDos");

            store.openCursor().onsuccess = function (e) {
                var cursor = e.target.result;

                if (cursor) {
                    list.push(cursor.value);
                    cursor.continue();
                }
                else {
                    success(list);
                }
            };
        };

        var search = function (term, success) {
            var
                list = [],
                transaction = MyToDo.data.db.transaction("toDos"),
                store = transaction.objectStore("toDos"),
                range = IDBKeyRange.bound(term, term + '\uffff'),
                index = store.index("name");

            index.openCursor(range).onsuccess = function (e) {
                var cursor = e.target.result;

                if (cursor) {
                    list.push(cursor.value);
                    cursor.continue();
                }
                else {
                    success(list);
                }
            };
        };

        var get = function (key, success) {
            var
                transaction = MyToDo.data.db.transaction("toDos"),
                store = transaction.objectStore("toDos"),
                request = store.get(key);

            request.onsuccess = function (e) {
                success(e.target.result);
            };
        };

        var add = function (toDo, success) {
            var
                transaction = MyToDo.data.db.transaction("toDos", "readwrite"),
                store = transaction.objectStore("toDos"),
                request = store.add({
                    name: toDo.name,
                    description: toDo.description
                });

            request.onsuccess = function (e) {
                toDo.id = e.target.result;
                success(toDo);
            };
        };

        var update = function (toDo, success) {
            var
                transaction = MyToDo.data.db.transaction("toDos", "readwrite"),
                store = transaction.objectStore("toDos"),
                request = store.put({
                    id: parseInt(toDo.id, 10),
                    name: toDo.name,
                    description: toDo.description
                });

            request.onsuccess = function () {
                success(toDo);
            };
        };

        var remove = function (key, success) {
            var
                transaction = MyToDo.data.db.transaction("toDos", "readwrite"),
                store = transaction.objectStore("toDos"),
                request = store.delete(key);

            request.onsuccess = function () {
                success();
            };
        };

        return {
            get: get,
            getList: getList,
            search : search,
            add: add,
            update: update,
            remove: remove
        };

    })();

})(MyToDo);

