# Enhancement Wish List

##  DONE - IDEA-001:  Regeneration History

Make the app remember up to 20 regenerations that the user can serially go back or forward to.

Similar to previous and forward in a carousel. Maybe the user can swipe back or forward.

When they exit the prompt screen to go back to previous menus, history will be erased.

The user can click a widget or swipe left within the prompt screen to recall the previous generated texts.

If the user is looking at a previous generated prompt, they can click a widget or swipe right within the prompt to move them forward to the next prompt generated after the one they are looking at.

If they are looking at the latest generation, do not enable the forward widget (can't swipe forward too).     If there's nothing in history do not enable the previous widget (can't swipe back too).

When they navigate backward in history,  animate text sliding to the right.   If they navigate forward, animate text sliding to the left (classic carousel motion).


## DONE - IDEA-002 - Add Helpful Texts

Non-invasive texts should be added to help the user navigate the app.

When they are at a sub-screen, show an indication of where they are OR where they'll end up when they click the back widget.

When they are at a prompt screen, show an indication that they can tap on words to lock or unlock them.


## DONE - IDEA-003 - Surreal Cauldron

Using tags in data files for greater control of generation process.

Currently - data files are tagged except for adjectives which will remain untagged.

Give user the ability to control the generated prompt by choosing the components and tags (if they want to)    

User can decide to compose the prompt different components (Adjective, Noun, Verb, Environment).

They can have multiple Nouns to come up with strange combinations.

When they choose a component and if they are tagged, offer a way to narrow down to tags.


## DONE - IDEA-004 - Retain locks and history when going back to cauldron config

When user locks words and goes back to reconfigure cauldron, it's most likely the user is thinking of another config but have reserved words they liked by locking.

Retain the lock when the go back to cauldron configuration.

After they do changes and hit generate, the user should see the locks on the prompt screen.

If they change tags then hit Generate:
- On unlocked word:  change the pool of the word
- On locked word:  don't do anything until they unlock on prompt screen.

If they add components then hit Generate:
- Original locked should be retained on screen, along with new components.

If they remove components then hit Generate:
- If they removed an unlocked word :  Dont show the word anymore.
- If they removed a locked word:  Dont show the word anymore.

History should also retained.

We destroy history and locks when they navigate back to the screens before  the config.    So get rid of locks when entering the cauldron screen from main menu and going back to main menu.


## DONE - IDEA-005 - Reduce repeated generations

Prevent words from appearing in regens until all options for pool are exhausted.

Ensure we don't regen on locked words to preserve words.


## DONE - IDEA-006 - If all words are locked - disable regen

Right now - regen is enabled and it keeps regenerating.


