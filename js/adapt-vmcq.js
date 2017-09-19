define([
    'components/adapt-contrib-media/libraries/mediaelement-and-player.js',
    'coreJS/adapt',
    'components/adapt-contrib-mcq/js/adapt-contrib-mcq',
    ],function(mediaelementplayer,Adapt,Mcq) {

    var Vmcq = Mcq.view.extend({

        events: {
            'change .vmcq-item input':'onItemSelected'
        },

        canReset: function() {
            return !this.$('.vmcq-widget, .button.reset').hasClass('disabled');
        },

        resetItems: function() {
            this.$('.vmcq-item label').removeClass('selected');
            this.$('input').prop('checked', false);
           // this.deselectAllItems();
            this.setAllItemsEnabled(true);
        },

        onItemSelected: function(event) {
            var index=$(event.currentTarget).parent('.vmcq-item').index();
            var selectedItemObject = this.model.get('_items')[index];

            if(index == 0) this.adjustHeight();
            
            if(this.model.get('_isEnabled') && !this.model.get('_isSubmitted')){
                this.toggleItemSelected(selectedItemObject, event);
            }
        },

        toggleItemSelected: function(selectedItem,event) {
            var item=this.model.get('_items'),
                itemIndex=_.indexOf(item,selectedItem),
                $itemLabel = this.$('label').eq(itemIndex),
                $itemInput = this.$('input').eq(itemIndex),
                selected   = !$itemLabel.hasClass('selected');

            if(selected) {
                this.$('label').removeClass('selected');
                $itemLabel.addClass('selected');
              //  this.$('input').prop('checked', false);
              //   $itemLabel.a11y_selected(true);
                  this.deselectAllItems();
            } else {
                $itemLabel.removeClass('selected');
              
            }
            //$itemInput.prop('checked', selected);
            item[itemIndex]._isSelected = selected;
             //onsole.log(this.model)
        },

         deselectAllItems: function() {
            _.each(this.model.get('_items'), function(item) {
                item._isSelected = false;
            }, this);
        },
        
        setupQuestion: function() {
            this.listenTo(Adapt.blocks, 'change:_isVisible', this.resizeVideo);
            this.listenTo(this.model, 'change:_isSubmitted', this.componentSubmitted);

        },

        componentSubmitted: function() {
            this.mediaElement.each(function() {
                this.player.pause();
            });
        },
        
        onQuestionRendered: function() {
            Mcq.view.prototype.onQuestionRendered.call(this);
            var view = this;
            this.mediaElement = this.$('audio, video').mediaelementplayer({
                pluginPath:'assets/',
                enableAutosize: false,
                success: function (mediaElement, domObject) {
                    mediaElement.addEventListener('ended', function(event) {
                        var $item = $(event.target).closest('.vmcq-item');
                        view.markItemAsWatched($item.index(), $item);
                    }, false);
                },
                features: ['playpause','progress','current','duration']
            });
        },

        adjustHeight: function() {
            var self=this;

            setTimeout(function() {
                var itemHeight=self.$('.vmcq-item').eq(0).height();
                self.$('.vmcq-item').eq(1).height(itemHeight);
            },100);
            
        },

        canSubmit: function() {
            var count = 0;

            _.each(this.model.get('_items'), function(item) {
                if (item._isSelected) {
                    ++count;
                }
            }, this);

            return (count > 0) ? true : false;

        },

        isCorrect: function() {
            var answerCorrectly=0;

            _.each(this.model.get('_items'), function(item, index) {
                    if(item._shouldBeSelected && item._isSelected == true) {
                        answerCorrectly++;
                    }
             })

            return (answerCorrectly > 0) ? true : false;
        },

        forceChangeEvent: function(event) {
            $("#" + $(event.currentTarget).closest("label").attr("for")).change();
        },

        isWatched: function (item) {
            return item._isWatched === true;
        },

        setupFeedback: function() {

            console.log("_isSubmitted",this.model.get('_isSubmitted'));
            if (this.isCorrect()) {
                this.setupCorrectFeedback();
            } else {
                this.setupIncorrectFeedback();
            }
        },

        markItemAsWatched: function (index, domObject) {
            var items = this.model.get('_items');
            if(index < 0 || index > items.length) return;

            var item = items[index];
            if(item) {
                item._isWatched = true;
                $(domObject).addClass('watched');
            }

            /*var requiredItems = _(items).where({ _shouldBeWatched: true });
            if(requiredItems.every(this.isWatched)) {
                if(this.getConfigSetting('_completeOnWatched')) {
                    this.model.set('_isComplete', true);
                }
                this.model.set('_isWatched', true);
                this.$el.addClass('watched');
            }*/
        },

        showCorrectAnswer: function() {
           $('.buttons-marking-icon').removeClass('icon-cross').addClass('icon-tick');
            _.each(this.model.get('_items'), function(item, index) {
                if(item._shouldBeSelected){
                    this.$('label').removeClass('selected');
                    this.$('label').eq(index).addClass('selected');
                }
            }, this);
        },

        hideCorrectAnswer: function() {
             $('.buttons-marking-icon').removeClass('icon-tick').addClass('icon-cross');
            _.each(this.model.get('_items'), function(item, index) {
                if(item._isSelected){
                    this.$('label').removeClass('selected');
                    this.$('label').eq(index).addClass('selected');
                }
            }, this);
        },

        resizeVideo: function () {
            $(window).trigger('resize');
        }/*,

        getConfigSetting: function (property, defaultValue) {
            if(typeof this.model.get(property) === 'undefined') {
                if(typeof Adapt.config.get('_vmcq')[property] === 'undefined') {
                    return defaultValue;
                } else {
                    return Adapt.config.get('_vmcq')[property];
                }
            } else {
                return this.model.get(property);
            }
        }*/
    }, {
        template: 'vmcq'
    });

   return Adapt.register("vmcq", {
        view: Vmcq,
        model: Mcq.model.extend({})
    });
});
