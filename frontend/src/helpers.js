const pageIds = ['login', 'registration', 'feed', 'view-profile', 'edit-profile', 'add-job', 'edit-job'];
const navIds = ['logo', 'show-feed-btn', 'view-profile-btn', 'logout-button', 'show-more-btn', 'add-job-btn', 'search-btn'];

import { populateFeed, resetFeed, populateProfileFeed } from './main.js';

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
  const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
  const valid = validFileTypes.find(type => type === file.type);
  // Bad data, let's walk away.
  if (!valid) {
    throw Error('provided file is not a png, jpg or jpeg image.');
  }
  
  const reader = new FileReader();
  
  const dataUrlPromise = new Promise((resolve,reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
  });
  reader.readAsDataURL(file);
  return dataUrlPromise;
}

/*******************************************************************************
 *                               HELPER FUNCTIONS                              *
 ******************************************************************************/

// Shows a page
export function show(element) {
  document.getElementById(element).classList.remove('hide');
}

// hide a page
export function hide(element) {
  document.getElementById(element).classList.add('hide');
}

// performs api calls - taken from Week 5 lectures
export function apiCall(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-type': 'application/json',
      },
    };
    if (method === 'GET') {
      // Come back to this
    } else {
      options.body = JSON.stringify(body);
    }
    if (localStorage.getItem('token')) {
      options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }

    fetch('http://localhost:5005/' + path, options)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showError(data.error);
        } else {
          resolve(data);
        }
      });
  });
};

// removes the active status of a button on the nav bar
export function removeActive(element) {
  document.getElementById(element).classList.remove('active');
}

// adds an active status of a button on the nav bar
export function makeActive(element) {
  document.getElementById(element).classList.add('active');
}

// stores the logged in userId to local storage
export function setUserId(userId) {
  localStorage.setItem('userId', userId);
}

// triggers the error modal with a custom message
export function showError(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorButton").click();
}

// validates an email to be in the correct email format
export function validateEmail(email) {
  const regex_pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return (regex_pattern.test(email));
}

// validates a password to be > 8 charatcer and ocntain at leat 1 lowercase 
// letter, 1 special character and 1 digit
export function validatePassword(password) {
  const regex_pattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;
  return (regex_pattern.test(password));
}

// checks that password and confirmPassword match
export function comparePasswords(password, confirmationPassword) {
  return password == confirmationPassword;
}

// shows the page you are navigating to and hides all the others
export function hideShowPages(pageId) {
  if (pageId === "feed") {
    populateFeed();
  } 
  for (const page of pageIds) {
    if (page === pageId) {
      show(page);
    } else {
      if (!document.getElementById(page).classList.contains('hide')) {
        hide(page);
        resetFeed(page);
      }
    }
  }
}

// makes the nav bar button active for the page you are navigating to (just clicked) 
// and remvoes active from all the other buttons
export function removeMakeActive(navId) {
  for (const nav of navIds) {
    if (nav === navId) {
      makeActive(navId);
    } else {
      if (document.getElementById(nav).classList.contains("active")) {
        removeActive(nav);
      }
    }
    if (document.getElementById('nav-bar').classList.contains('responsive')) {
      document.getElementById('nav-bar').classList.remove('responsive')
    }
  }
}

// checks if the user has or hasn't kliked a post in order to set the state of the like button
export function findUsersLike(postId, startPoint) {
  apiCall('job/feed?start=' + (startPoint * 5), 'GET', {})
    .then((data) => {
      //if data is empty this indicates that the button was clicked from the user's profile feed
      if (data.length === 0) {
        //return as the user cannot like their own post
        return;
      }

      //find the post that is being loaded
      let postLikes;
      for (const feedItem of data) {
        //populate the like modal
        if (feedItem.id === postId) {
          postLikes = feedItem.likes;
          break;
        }
      }

      //if it cannot be found, move the start point up to look at the next set of jobs
      if (postLikes === undefined) {
        return findUsersLike(postId, (startPoint + 1));
      }
      
      const userId = window.localStorage.getItem('userId');

      //go through the likes to see if the user is in the list of likes, and set the state of the button
      for (let i = 0; i < postLikes.length; i++) {
        if(postLikes[i].userId === parseInt(userId)) {
          const cloneThumb = document.getElementById("filledThumb").cloneNode(true);
          cloneThumb.classList.remove('hide');
          document.getElementById('like-button' + postId).textContent = " Unlike";
          document.getElementById('like-button' + postId).prepend(cloneThumb);
          return;
        }
      }
      const cloneThumb = document.getElementById("unfilledThumb").cloneNode(true);
      cloneThumb.classList.remove('hide');
      document.getElementById('like-button' + postId).textContent = " Like";
      document.getElementById('like-button' + postId).prepend(cloneThumb);
    })
}

// populate the feed's post modal with the likes of the clicked post
export function findLikes(postId, startPoint) {
  apiCall('job/feed?start=' + (startPoint * 5), 'GET', {})
  .then((data) => {
    // if job/feed returns empty switch to a different
    let postLikes;
    //if data is empty this indicates that the button was clicked from the user's profile feed
    if (data.length === 0) {
      //go through the profile's feed instead
      findUsersPostsLikes(postId);
      return;
    } else {
      //look through the feeds's posts for the likes
      for (const feedItem of data) {
        if (feedItem.id === postId) {
          postLikes = feedItem.likes;
          break;
        }
      }
    }
    //if not found go to next set of job posts
    if (postLikes === undefined) {
      return findLikes(postId, (startPoint + 1));
    }
    
    //clone and populate the fields of the like card
    const node = document.getElementById("like-card");
    for (let i = 0; i < postLikes.length; i++) {
      //make clone of node and change all id's
      const clone = node.cloneNode(true);
      //update fields of the card
      document.getElementById('postModalBody').appendChild(updateCloneIds(clone, postId + i));      
      document.getElementById('like-card-username' + postId + i).addEventListener('click', usernamePressedFromLikes);
      document.getElementById('like-card-username' + postId + i).textContent = postLikes[i].userName;
      //get profile image for each
      apiCall('user?userId=' + postLikes[i].userId, 'GET', {} )
      .then((data) => {
        for (let i = 0; i < postLikes.length; i++) {
          if (postLikes[i].userId === data.id)
          {
            if (data.image === undefined) {
              document.getElementById('like-card-profile-image' + postId + i).src = "/assets/default-profile-picture.png";
            } else {
              document.getElementById('like-card-profile-image' + postId + i).src = data.image;
            }
          }
        }
      });
    }
  });
}

// populate the profile-feed's post modal with the likes of the clicked post
const findUsersPostsLikes = (postId) => {
  apiCall('user?userId=' + window.localStorage.getItem('viewingUserId'), 'GET', {})
  .then((data) => {
    let postLikes;
    const feedItems = data.jobs;

    // find the post's likes
    for (let i = 0; i < data.jobs.length; i++) {
      if (feedItems[i].id === postId) {
        postLikes = feedItems[i].likes;
        break;
      }
    }

    // clone and populate the like cards
    const node = document.getElementById("like-card");
    for (let i = 0; i < postLikes.length; i++) {
      //make clone of node and change all id's
      const clone = node.cloneNode(true);
      //update fields of the card
      document.getElementById('postModalBody').appendChild(updateCloneIds(clone, postId + i));      
      document.getElementById('like-card-username' + postId + i).addEventListener('click', usernamePressedFromUsersLikes);
      document.getElementById('like-card-username' + postId + i).textContent = postLikes[i].userName;
      //get profile image for each
      apiCall('user?userId=' + postLikes[i].userId, 'GET', {} )
      .then((data) => {
        for (let i = 0; i < postLikes.length; i++) {
          if (postLikes[i].userId === data.id)
          {
            if (data.image === undefined) {
              document.getElementById('like-card-profile-image' + postId + i).src = "/assets/default-profile-picture.png";
            } else {
              document.getElementById('like-card-profile-image' + postId + i).src = data.image;
            }
          }
        }
      });
    }
  });
}

// populate the feed's post modal with the comments of the clicked post
export function findComments(postId, startPoint) {
  apiCall('job/feed?start=' + (startPoint * 5), 'GET', {})
  .then((data) => {
    // if data is empty this indicates that the button was clicked from the user's profile feed
    if (data.length === 0) {
      findUsersPostsComments(postId);
      return;
    }
    // find the post's comments
    let postComments;
    for (const feedItem of data) {
      if (feedItem.id === postId){
        postComments = feedItem.comments;
        break
      }
    }
    if (postComments === undefined) {
      return findComments(postId, (startPoint + 1));
    }

    // clone and populate the fields of the comment cards
    const node = document.getElementById("comment-card");
    for (let i = 0; i < postComments.length; i++) {
      const clone = node.cloneNode(true);
      // update fields of the card
      document.getElementById('postModalBody').appendChild(updateCloneIds(clone, postId + i));
      document.getElementById('comment-username' + postId + i).addEventListener('click', usernamePressedFromComments);
      document.getElementById('comment-username' + postId + i).textContent = postComments[i].userName;
      document.getElementById('card-text' + postId + i).textContent = postComments[i].comment;
      //get profile image from user id
      apiCall('user?userId=' + postComments[i].userId, 'GET', {} )
      .then((data) => {
        for (let i = 0; i < postComments.length; i++) {
          if (postComments[i].userId === data.id)
          {
            if (data.image === undefined) {
              document.getElementById('comment-profile-image' + postId + i).src = "/assets/default-profile-picture.png";
            } else {
              document.getElementById('comment-profile-image' + postId + i).src = data.image;
            }
          }
        }
      });
    }
  });
}

// populate the profile-feed's post modal with the comments of the clicked post
const findUsersPostsComments = (postId) => {
  apiCall('user?userId=' + window.localStorage.getItem('viewingUserId'), 'GET', {})
  .then((data) => {
    let postComments;
    // find the post's comments
    const feedItems = data.jobs;
    for (let i = 0; i < data.jobs.length; i++) {
      if (feedItems[i].id === postId) {
        postComments = feedItems[i].comments;
        break;
      }
    }

    //clone and populate the fields of the comment card
    const node = document.getElementById("comment-card");
    for (let i = 0; i < postComments.length; i++) {
      const clone = node.cloneNode(true);
      //update fields of the card
      document.getElementById('postModalBody').appendChild(updateCloneIds(clone, postId + i));
      document.getElementById('comment-username' + postId + i).addEventListener('click', usernamePressedFromUsersComments);
      document.getElementById('comment-username' + postId + i).textContent = postComments[i].userName;
      document.getElementById('card-text' + postId + i).textContent = postComments[i].comment;
      //get profile image from user id
      apiCall('user?userId=' + postComments[i].userId, 'GET', {} )
      .then((data) => {
        for (let i = 0; i < postComments.length; i++) {
          if (postComments[i].userId === data.id)
          {
            if (data.image === undefined) {
              document.getElementById('comment-profile-image' + postId + i).src = "/assets/default-profile-picture.png";
            } else {
              document.getElementById('comment-profile-image' + postId + i).src = data.image;
            }
          }
        }
      });
    }
  });
}

// find the creator of the post, and goes to their page
export function findCreator(postId, startPoint) {
  apiCall('job/feed?start=' + (startPoint * 5), 'GET', {})
  .then((data) => {
    //if data is empty this indicates that the button was clicked from the user's profile feed
    if (data.length === 0) {
      //don't do anything;
      return;
    }
    //find the creator's id
    let creatorId;
    for (const feedItem of data) {
      if (feedItem.id === postId){
        creatorId = feedItem.creatorId;
        break
      }
    }
    if (creatorId === undefined) {
      return findCreator(postId, (startPoint + 1));
    }

    window.localStorage.setItem('viewingUserId', creatorId);
    populateProfileFeed(creatorId);
    removeActive('show-feed-btn');
    hideShowPages('view-profile');
  });
}

// gets id's and position of post like
const usernamePressedFromLikes = e => {
  const cardId = e.target.id;
  const postIdIndex = cardId.replace("like-card-username", "");
  const postId = postIdIndex.slice(0, -1);
  const position = postIdIndex.slice(-1);
  findLiker(postId, position, 0);
}

// finds the id of the user that liked the feed's post and goes to their page
const findLiker = (postId, position, startPoint) => {
  apiCall('job/feed?start=' + (startPoint*5), 'GET', {})
  .then((data) => {
    let likes;
    for (const feedItem of data) {
      if (feedItem.id === postId) {
        likes = feedItem.likes;
        break;
      }
    }    
    if (likes === undefined) {
      findLiker(postId, position, (startPoint + 1));
    }
    populateProfileFeed(likes[position].userId);
    window.localStorage.setItem('viewingUserId', likes[position].userId);
    removeActive('show-feed-btn');
    document.getElementById('modal-close-btn').click();
    hideShowPages('view-profile');
  });
}

// find the id of the user that liked the post in the profile-feed and navigate to their profile
const usernamePressedFromUsersLikes = e => {
  const cardId = e.target.id;
  const postIdIndex = cardId.replace("like-card-username", "");
  const postId = postIdIndex.slice(0, -1);
  const position = postIdIndex.slice(-1);

  apiCall('user?userId=' + window.localStorage.getItem('viewingUserId'), 'GET', {})
  .then((data) => {
    let postLikes;
    const feedItems = data.jobs;
    for (let i = 0; i < data.jobs.length; i++) {
      if (feedItems[i].id === postId) {
        postLikes = feedItems[i].likes;
        break;
      }
    }  
    populateProfileFeed(postLikes[position].userId);
    window.localStorage.setItem('viewingUserId', postLikes[position].userId);
    removeActive('show-feed-btn');
    document.getElementById('modal-close-btn').click();
    hideShowPages('view-profile');
  });
}

// finds the id of the post and the position of post comment
const usernamePressedFromComments = e => {
  const cardId = e.target.id;
  const postIdIndex = cardId.replace("comment-username", "");
  const postId = postIdIndex.slice(0, -1);
  const position = postIdIndex.slice(-1);
  findCommentor(postId, position, 0)
}

// finds the id of the user that commented the feed's post and goes to their page
const findCommentor = (postId, position, startPoint) => {
  apiCall('job/feed?start=' + (startPoint*5), 'GET', {})
  .then((data) => {
    let comments;
    for (const feedItem of data) {
      if (feedItem.id === postId){
        comments = feedItem.comments;
        break
      }
    }    
    if (comments === undefined) {
      findCommentor(postId, position, (startPoint + 1));
    }
    populateProfileFeed(comments[position].userId);
    localStorage.setItem('viewingUserId', comments[position].userId);
    removeActive('show-feed-btn');
    document.getElementById('modal-close-btn').click();
    hideShowPages('view-profile');
  });
}

// find the id of the user that comment the post in the profile-feed and navigate to their profile
const usernamePressedFromUsersComments = e => {
  const cardId = e.target.id;
  const postIdIndex = cardId.replace("comment-username", "");
  const postId = postIdIndex.slice(0, -1);
  const position = postIdIndex.slice(-1);

  apiCall('user?userId=' + window.localStorage.getItem('viewingUserId'), 'GET', {})
  .then((data) => {
    let postComments;
    const feedItems = data.jobs;
    for (let i = 0; i < data.jobs.length; i++) {
      if (feedItems[i].id === postId) {
        postComments = feedItems[i].comments;
        break;
      }
    }
    populateProfileFeed(postComments[position].userId);
    localStorage.setItem('viewingUserId', postComments[position].userId);
    removeActive('show-feed-btn');
    document.getElementById('modal-close-btn').click();
    hideShowPages('view-profile');
  });
}

// update all id's of cloned cards
export function updateCloneIds(clone, id) {
  clone.classList.remove("hide");
  let elementsThatHaveId = [...clone.querySelectorAll('[id]')];
  if (clone.matches('[id]'))  elementsThatHaveId.push(clone);
  elementsThatHaveId.forEach((e) => {
    e.id += id;
  });
  return clone;
}

// expands nav bar menu
export function navFunction() {
  let nav = document.getElementById("nav-bar");
  if (nav.className === "topnav") {
    nav.className += " responsive";
  } else {
    nav.className = "topnav";
  }
}

// Watches or unwatchees a user profile
export function watchUnwatchUser(body) {
  apiCall('user/watch' ,'PUT', body) 
    .then((data) => {
      if (document.getElementById('profile-action-btn').textContent === "Watch user") {
        document.getElementById('profile-action-btn').textContent = "Unwatch user"

        const numWatchees = parseInt(document.getElementById('watchees').textContent) + 1;
        if (numWatchees === 1) {
          document.getElementById('watchees').textContent = numWatchees + " watchee";
        } else {
          document.getElementById('watchees').textContent = numWatchees + " watchees";
        }
      } else {
        document.getElementById('profile-action-btn').textContent = "Watch user"

        const numWatchees = parseInt(document.getElementById('watchees').textContent) - 1;
        if (numWatchees === 1) {
          document.getElementById('watchees').textContent = numWatchees + " watchee";
        } else {
          document.getElementById('watchees').textContent = numWatchees + " watchees";
        }
      }
    });
}