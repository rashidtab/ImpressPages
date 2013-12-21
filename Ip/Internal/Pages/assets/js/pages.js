var app = angular.module('Pages', []);
app.run(function ($rootScope) {
    $rootScope.$on('$locationChangeSuccess', function (e, newUrl, oldUrl) {
        $rootScope.$broadcast('PathChanged', newUrl);
    });
});





function ipPages($scope, $location) {

    //init
    $scope.activeLanguage = {id: null};
    $scope.activeZone = {name: ''};
    $scope.copyPageId = false;
    $scope.cutPageId = false;
    $scope.selectedPageId = null;
    $scope.languages = languageList;
    $scope.zones = zoneList;
    $scope.initialized = false;

    $scope.$on('PathChanged', function(event, path) {
        var zoneName = getHashParams().zone;
        var languageId = getHashParams().language;
        var pageId = getHashParams().page;

        if (!$scope.initialized) {
            if (languageId == null) {
                languageId = languageList[0].id;
            }
            if (zoneName == null) {
                zoneName = zoneList[0].name;
            }

        }


        if (languageId && languageId != $scope.activeLanguage.id) {
            $.each(languageList, function(key, value) {
                if (value.id == languageId) {
                    $scope.activateLanguage(value);
                }
            });
        }


        if (zoneName && zoneName != $scope.activeZone.name) {
            $.each(zoneList, function(key, value) {
                if (value.name == zoneName) {
                    $scope.activateZone(value);
                }
            });
        };



        if (pageId && pageId != $scope.selectedPageId) {
            $scope.activatePage(pageId, $scope.activeZone.name);
        }

    });



    $scope.setZoneHash = function(zone) {
        updateHash(null, zone.name, false);
    }

    $scope.setLanguageHash = function(language) {
        updateHash(language.id, null, false);
    }


    $scope.activateLanguage = function(language) {
        $scope.activeLanguage = language;
        initTree();
        //updateHash();
    }

    $scope.activateZone = function(zone) {
        $scope.activeZone = zone;
        $scope.selectedPageId = null;
        initTree();
        //updateHash();
    }

    $scope.activatePage = function (pageId, zoneName) {
        $scope.selectedPageId = pageId;
        var $properties = $('.ipsProperties');
        $properties.ipPageProperties({
            pageId : pageId,
            zoneName : zoneName
        });
        $properties.off('update.ipPages').on('update.ipPages', function() {
            getJsTree().set_text(getJsTree().get_selected() , $properties.find('input[name=navigationTitle]').val());
        });
        $properties.off('delete.ipPages').on('delete.ipPages', function() {
            deletePage($scope.selectedPageId, function(){
                getJsTree().remove(getJsTree().get_selected());
            });
        });
        $properties.off('edit.ipPages').on('edit.ipPages', function() {
            editPage($scope.selectedPageId);
        });

    }

    $scope.addPageModal = function() {
        var $modal = $('.ipsAddModal');
        $modal.find('input[name=title]').val('');
        $modal.modal();


        $modal.find('.ipsAdd').off('click').on('click', function(){$modal.find('form').submit()});
        $modal.find('form').off('submit').on('submit', function(e) {
            e.preventDefault();
            var title = $modal.find('input[name=title]').val();
            var visible = $modal.find('input[name=visible]').is(':checked') ? 1 : 0;
            addPage(title, visible);
            $modal.modal('hide');
        });
    }

    $scope.cutPage = function() {
        $scope.copyPageId = false;
        $scope.cutPageId = $scope.selectedPageId
    }

    $scope.copyPage = function () {
        $scope.cutPageId = false;
        $scope.copyPageId = $scope.selectedPageId;
    }



    $scope.pastePage = function () {
        var tree = getJsTree();
        var position = tree._get_children(-1).length; //last position
        var node = tree.get_selected();
        if (node.length) {
            var position = node.index() + 1;
        }
        if ($scope.cutPageId) {
            movePage($scope.cutPageId, $scope.activeLanguage.id, $scope.activeZone.name, $scope.selectedPageId, position, true);
        } else {
            copyPage($scope.copyPageId, $scope.activeLanguage.id, $scope.activeZone.name, $scope.selectedPageId, position, function () {
                    refresh();
            });
        }

    }

    var initTree = function () {
        $scope.selectedPageId = null;
        getTreeDiv().ipPageTree({languageId: $scope.activeLanguage.id, zoneName: $scope.activeZone.name});
        getTreeDiv().off('select_node.jstree').on('select_node.jstree', function(e) {
            var node = getJsTree().get_selected();
            updateHash(null, null, node.attr('pageId'));
            $scope.$apply();
        });

        getTreeDiv().off('move_node.jstree').on('move_node.jstree', function(e, moveData) {
            moveData.rslt.o.each(function(i) {
                var pageId = $(this).attr("pageId");
                var destinationPageId = moveData.rslt.np.attr("pageId");
                if (!destinationPageId) { //replace undefined with null;
                    destinationPageId = null;
                }
                var destinationPosition = moveData.rslt.cp + i;
                movePage(pageId, $scope.activeLanguage.id, $scope.activeZone.name, destinationPageId, destinationPosition);
            });
        });



    }




    var getTreeDiv = function () {
        return $('#pages_' + $scope.activeLanguage.id + '_' + $scope.activeZone.name).find('.ipsTree');
    }

    var getJsTree = function () {
        return jQuery.jstree._reference('#pages_' + $scope.activeLanguage.id + '_' + $scope.activeZone.name + ' .ipsTree');
    }

    var refresh = function () {
        $('.ipsTree').ipPageTree('destroy');
        $scope.activateZone($scope.activeZone);
        $scope.$apply();
    }


    var addPage = function (title, visible) {
        var data = {
            aa: 'Pages.addPage',
            securityToken: ip.securityToken,
            title: title,
            visible: visible,
            zoneName: $scope.activeZone.name,
            languageId: $scope.activeLanguage.id
        };

        $.ajax({
            type: 'POST',
            url: ip.baseUrl,
            data: data,
            context: this,
            success: function (response) {
                refresh();
            },
            error: function(response) {
                if (ip.developmentEnvironment || ip.debugMode) {
                    alert('Server response: ' + response.responseText);
                }
            },
            dataType: 'json'
        });

    }

    var editPage = function (pageId, successCallback) {
        var data = {
            aa: 'Pages.getPageUrl',
            pageId: pageId
        };

        $.ajax({
            type: 'GET',
            url: ip.baseUrl,
            data: data,
            context: this,
            success: function(response) {
                window.location = response.pageUrl;
            },
            error: function(response) {
                if (ip.developmentEnvironment || ip.debugMode) {
                    alert('Server response: ' + response.responseText);
                }
            },
            dataType: 'json'
        });
    }

    var deletePage = function (pageId, successCallback) {
        var data = {
            aa: 'Pages.deletePage',
            pageId: pageId,
            securityToken: ip.securityToken
        };

        $.ajax({
            type: 'POST',
            url: ip.baseUrl,
            data: data,
            context: this,
            success: successCallback,
            error: function(response) {
                if (ip.developmentEnvironment || ip.debugMode) {
                    alert('Server response: ' + response.responseText);
                }
            },
            dataType: 'json'
        });
    }


    var copyPage = function(pageId, destinationLanguageId, destinationZoneName, destinationParentId, destinationPosition, callback) {
        var data = {
            aa: 'Pages.copyPage',
            pageId: pageId,
            destinationParentId: destinationParentId,
            destinationPosition: destinationPosition,
            languageId: destinationLanguageId,
            zoneName: destinationZoneName,
            securityToken: ip.securityToken
        };

        $.ajax({
            type: 'POST',
            url: ip.baseUrl,
            data: data,
            context: this,
            success: callback,
            error: function(response) {
                if (ip.developmentEnvironment || ip.debugMode) {
                    alert('Server response: ' + response.responseText);
                }
            },
            dataType: 'json'
        });
    }

    var movePage = function(pageId, destinationLanguageId, destinationZoneName, destinationParentId, destinationPosition, doRefresh) {
        var data = {
            aa: 'Pages.movePage',
            pageId: pageId,
            destinationPosition: destinationPosition,
            destinationParentId: destinationParentId,
            languageId: destinationLanguageId,
            zoneName: destinationZoneName,
            securityToken: ip.securityToken
        };

        $.ajax({
            type: 'POST',
            url: ip.baseUrl,
            data: data,
            context: this,
            success: function (response) {
                if (doRefresh) {
                    refresh();
                }
            },
            error: function(response) {
                if (ip.developmentEnvironment || ip.debugMode) {
                    alert('Server response: ' + response.responseText);
                }
            },
            dataType: 'json'
        });
    }

    var updateHash = function (languageId, zoneName, pageId) {
        if (languageId === null) {
            languageId = $scope.activeLanguage.id;
        }
        if (zoneName === null) {
            zoneName = $scope.activeZone.name
        }
        if (pageId === null) {
            pageId = $scope.selectedPageId;
        }
        var path = 'language=' + languageId + '&zone=' + zoneName;
        if (pageId) {
            path = path + '&page=' + pageId;
        }
        $location.path(path);
    }

    function getHashParams() {

        var hashParams = {};
        var e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = window.location.hash.substring(1);

        while (e = r.exec(q))
            hashParams[d(e[1])] = d(e[2]);

        return hashParams;
    }

}


