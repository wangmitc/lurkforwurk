import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, show, hide, apiCall, removeActive,  makeActive, setUserId, 
  showError, validateEmail, validatePassword, comparePasswords, hideShowPages, removeMakeActive, 
  findUsersLike, findLikes,  findComments, findCreator, updateCloneIds, navFunction, watchUnwatchUser} 
  from './helpers.js';

// global variables
let btmReached = false;
let btmReachedCount = 0;

/*******************************************************************************
 *                                BONUS - NAV BAR                              *
 ******************************************************************************/
// when the Feed button on the nav bar is pressed it navigates to the feed page
document.getElementById('show-feed-btn').addEventListener('click', () => {
  hideShowPages('feed');
  removeMakeActive('show-feed-btn');
});

// when the logout button is pressed on the nav bar the user is logged out
// and redirected to the sign in page
document.getElementById('logout-button').addEventListener('click', () => {
  removeMakeActive('feed');
  hideShowPages('login');
  hide('nav-bar');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('viewingUserId');
  resetFeed('feed');
  show('empty-feed');
  show('empty-profile-feed');
});

// when the logo on the nav bar is pressed it navigates to the feed page
document.getElementById('logo').addEventListener('click', () => {
  hideShowPages('feed');
  removeMakeActive('show-feed-btn');
});

// when the page is less than 855px wide a burger icon apears and when pressed
// expands to show all the nav bar icons
document.getElementById('show-more-btn').addEventListener('click', () => {
  navFunction();
});

/*******************************************************************************
 *                                 MILESTONE 1                                 *
 ******************************************************************************/

// sets the token when a user is logged in
const setToken = (token, source, destination) => {
  localStorage.setItem('token', token);
  addInfiniteScroll();
  populateFeed();
  show('nav-bar');
  show(destination);
  hide(source);
}

// load of page if token is available and valid, log in the user
if (localStorage.getItem('token')) {
  addInfiniteScroll();
  makeActive('show-feed-btn');
  show('nav-bar');
  hideShowPages('feed');
}

// logs in the user when the log in button is clicked
document.getElementById('login-button').addEventListener('click', () => {
  const body = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value
  };
  apiCall('auth/login', 'POST', body)
    .then((data) => {
      setToken(data.token, 'login', 'feed');
      setUserId(data.userId);
      makeActive('show-feed-btn');
      document.getElementsByName('login-form')[0].reset();
    });
});

// redirects the user to theregistration page when the sign up button is clicked
document.getElementById('sign-up-btn').addEventListener('click', () => {
  hideShowPages('registration');
});

// registers a new user and logs them in
document.getElementById('registration-button').addEventListener('click', () => {
  const name = document.getElementById('registration-name').value;
  if (name.length === 0) {
    showError('Please enter a name')
    return;
  }

  // Validating email format
  const email = document.getElementById('registration-email').value;
  if (!validateEmail(email)) {
    showError('Email not valid');
    return;
  } 

  // Checking passwords match
  const password = document.getElementById('registration-password').value;
  // Check strength of password
  if (!validatePassword(password)) {
    showError("Your password must be at least:\r\n - 8 characters long\r\n - 1 uppercase letter\r\n - 1 lowercase letter\r\n - 1 digit\r\n - 1 special charcter");
    return;
  }

  const confirmPassword = document.getElementById('registration-confirm-password').value;
  if (!comparePasswords(password, confirmPassword)) {
    showError('Passwords must match');
    return;
  } 

  const body = {
    email: email,
    name: name,
    password: password,
  };

  apiCall('auth/register', 'POST', body)
    .then((data) => {
      setToken(data.token, 'registration', 'feed');
      setUserId(data.userId);
      document.getElementsByName('registration-form')[0].reset();
    });
});

// returns back to sign in page from register page
document.getElementById('register-back-btn').addEventListener('click', () => {
  hideShowPages('login');
});

/*******************************************************************************
 *                                 MILESTONE 2                                 *
 ******************************************************************************/
// populates the feed with all the feed cards
export function populateFeed() {
  if (btmReachedCount == 0 && !btmReached) {
    document.getElementById('feed-body').textContent = "";
  }
  let startPoint = btmReachedCount;
  apiCall('job/feed?start=' + (startPoint * 5), 'GET', {})
    .then((data) => {
      if (data.length === 5) {
        btmReachedCount++;
      }
      createFeedCards(data, 'feed-body', startPoint);
      if (document.getElementById('feed-body').textContent !== "") {
        hide('empty-feed');
      }
    });
};

// resets the feed cards
export function resetFeed(location) {
  if (location === "feed") {
    document.getElementById('feed-body').textContent = '';
  }
  else if (location === "view-profile") {
    document.getElementById('profile-feed-body').textContent = '';
  }
  //reset globals
  btmReached = false;
  btmReachedCount = 0;
}

// creates all the feed cards
export function createFeedCards(data, location, startPoint) {
  const node = document.getElementById("feed-card");
  // document.getElementById(location).textContent = '';
  //increase the btm reached if the joob/feed api call was full (got 5 jobs)
  for (const feedItem of data) {
    //clone the feed card node and make it visible
    const postId = feedItem.id;
    //if the job already exists skip it
    if (document.getElementById('feed-card' + postId) !== null) {
      continue;
    }
    // else set new bottom
    btmReached = false;
    const clone = node.cloneNode(true);
    //update all id's in the newly cloned feed card node
    updateCloneIds(clone, postId);
    //update the fields of the card
    document.getElementById(location).appendChild(clone);
    //check if current user equals creator
    if (feedItem.creatorId !== parseInt(window.localStorage.getItem('userId'))){
      //remove post options if not creator
      document.getElementById("creator-post-options" + postId).remove();
    }
    const createdDate = new Date(feedItem.createdAt);
    const currentTimeDate = new Date();
    var dayBefore = new Date().getTime() - (24 * 60 * 60 * 1000);
    if (createdDate >= dayBefore) {
      const hours = Math.floor((Math.abs((currentTimeDate - createdDate)))/ (1000 * 60 * 60));
      document.getElementById('card-date' + postId).textContent = "Posted " + hours +" hr"; 
      if (hours !== 1) {
        document.getElementById('card-date' + postId).textContent +="s";
      }
      const mins = Math.floor((Math.abs((currentTimeDate - createdDate)))/ (1000 * 60)) - (hours * 60);
      document.getElementById('card-date' + postId).textContent += " and "+ mins + " min";
      if (mins !== 1) {
        document.getElementById('card-date' + postId).textContent += "s";
      }
      document.getElementById('card-date' + postId).textContent += " ago";
    } else {
      document.getElementById('card-date' + postId).textContent = "Posted on " + ("0" + createdDate.getDate()).slice(-2) + "/" + ("0" + (createdDate.getMonth() + 1)).slice(-2) + "/" + createdDate.getFullYear();
    }
    const startDate = new Date(feedItem.start);
    document.getElementById('card-start-date' + postId).textContent="Start " + ("0" + startDate.getDate()).slice(-2) + "/" + ("0" + (startDate.getMonth() + 1)).slice(-2) + "/" + startDate.getFullYear()
    document.getElementById('card-title' + postId).textContent=feedItem.title;
    document.getElementById('card-text' + postId).textContent=feedItem.description;
    if (feedItem.image !== undefined) {
      document.getElementById('card-image' + postId).src=feedItem.image;
    } else {
      document.getElementById('card-image' + postId).remove();
    }
    document.getElementById('card-likes' + postId).textContent=feedItem.likes.length + " likes";
    document.getElementById('card-comments' + postId).textContent=feedItem.comments.length + " comments";

    //add event listeners to cards
    document.getElementById('card-likes' + postId).addEventListener('click', cardLikesPressed);
    document.getElementById('card-comments' + postId).addEventListener('click', cardCommentPressed);
    document.getElementById('like-button' + postId).addEventListener('click',  likeButtonPressed);
    document.getElementById('comment-button' + postId).addEventListener('click', commentButtonPressed);
    document.getElementById('card-username' + postId).addEventListener('click', profileButtonPressed);
    if (feedItem.creatorId === parseInt(window.localStorage.getItem('userId'))){
      // add option eventlisteners if creator
      document.getElementById("edit-post" + postId).addEventListener('click', editButtonPressed);
      document.getElementById("delete-post" + postId).addEventListener('click', deleteButtonPressed);
    }
    
    apiCall('user?userId=' + feedItem.creatorId, 'GET', {})
    .then((data) => {
      //check if data.image equals undefined
      if (data.image === undefined) {
        document.getElementById('card-profile-image' + postId).src = "/assets/default-profile-picture.png";
      } else {
        document.getElementById('card-profile-image' + postId).src = data.image;
      }
      document.getElementById('card-username' + postId).textContent = data.name;
      
      //check if user is in the post's likes
      findUsersLike(postId, startPoint)
    });
  }
}

/*******************************************************************************
 *                                 MILESTONE 3                                 *
 ******************************************************************************/

// triggers a mdoal to show all the likes on a post
const cardLikesPressed = e => { 
  //reset the modal body
  document.getElementById('postModalBody').textContent = "";
  document.getElementById('exampleModalLongTitle').textContent = "Likes";
  //get post id
  const cardId = e.target.id;
  const postId = cardId.replace("card-likes", "");
  //find post likes
  findLikes(postId, 0);
}

// triggers a mdoal to show all the comments on a post
const cardCommentPressed = e => { 
  //reset modal
  document.getElementById('postModalBody').textContent = "";
  //update modal title
  document.getElementById('exampleModalLongTitle').textContent = "Comments"
  //getPost id
  const cardId = e.target.id;
  const postId = cardId.replace("card-comments", "");
  // find the post's comments
  findComments(postId, 0);
}

// likes a post
const likeButtonPressed = e => {
  const cardId = e.target.id;
  const postId = cardId.replace("like-button", "");
  const isLiked = document.getElementById('like-button' + postId).textContent;
  if (isLiked  === " Like") {
    const payload = {
      id: postId, 
      turnon: true
    };
    apiCall('job/like' ,'PUT', payload)
    .then((data) => {
      document.getElementById('like-button' + postId).textContent = " Unlike";
      const cloneThumb = document.getElementById("filledThumb").cloneNode(true);
      cloneThumb.classList.remove('hide');
      document.getElementById('like-button' + postId).prepend(cloneThumb);
      document.getElementById('card-likes' + postId).textContent = parseInt(document.getElementById('card-likes' + postId).textContent) + 1 + " like";
      if (document.getElementById('card-likes' + postId).textContent !== "1") {
        document.getElementById('card-likes' + postId).textContent += "s"
      }
    })
  } else if (isLiked  === " Unlike"){
    const payload = {
      id: postId, 
      turnon: false
    };
    apiCall('job/like' ,'PUT', payload)
    .then((data) => {
      document.getElementById('like-button' + postId).textContent = " Like";
      const cloneThumb = document.getElementById("unfilledThumb").cloneNode(true);
      cloneThumb.classList.remove('hide');
      document.getElementById('like-button' + postId).prepend(cloneThumb);
      document.getElementById('card-likes' + postId).textContent = parseInt(document.getElementById('card-likes' + postId).textContent) - 1 + " like";
      if (document.getElementById('card-likes' + postId).textContent !== "1") {
        document.getElementById('card-likes' + postId).textContent += "s"
      }
    })
  }
}

/*******************************************************************************
 *                                 MILESTONE 4                                 *
 ******************************************************************************/

// viewing a user profile when the view profile button in the nav bar is pressed
document.getElementById('view-profile-btn').addEventListener('click', () => {
  populateProfileFeed(window.localStorage.getItem('userId'));
  localStorage.setItem('viewingUserId', window.localStorage.getItem('userId'));
  removeMakeActive('view-profile-btn');
  hideShowPages('view-profile');
});

// button to edit a user profile, watch a user or unwatch a user profile
document.getElementById('profile-action-btn').addEventListener('click', () => {
  if (document.getElementById('profile-action-btn').textContent === "Edit profile") {
    editProfile(); 
  } else if (document.getElementById('profile-action-btn').textContent === "Watch user") {
    const body = {
      email: document.getElementById('profile-email').textContent,
      turnon: true,
    }
    watchUnwatchUser(body);
  } else {
    const body = {
      email: document.getElementById('profile-email').textContent,
      turnon: false,
    }
    watchUnwatchUser(body);  
  }
});

// populates the edit profile page with the existing profile data
export function editProfile() {
  hide('view-profile');
  show('edit-profile');
  apiCall('user?userId=' + window.localStorage.getItem('userId')  , 'GET', {})
    .then((data) => {
      document.getElementById('update-name').value = data.name;
      document.getElementById('update-email').value = data.email;
  });
}

// saves the edit profile changes when clicked
document.getElementById('save-profile-changes-btn').addEventListener('click', () => {
  const name = document.getElementById('update-name').value;
  const email = document.getElementById('update-email').value;
  const password = document.getElementById('update-password').value;
  const confirmPassword = document.getElementById('update-confirm-password').value;
  const image = document.getElementById('profile-img').files[0];
  if (password !== '' && !validatePassword(password)) {
    showError("Your password must be at least:\r\n - 8 characters long\r\n - 1 uppercase letter\r\n - 1 lowercase letter\r\n - 1 digit\r\n - 1 special charcter");
    return;
  }
  // Checking passwords match
  if (!comparePasswords(password, confirmPassword)) {
    showError('Password and confirm password must match');
    return;
  } 

  if(!validateEmail(email)) {
    showError('Email not valid');
    return;
  } 

  let imageUrl;
  if (image !== undefined) {
    // Taken inspiration for lines 376 - 381 from:
    // https://javascript.plainenglish.io/how-to-check-a-selected-images-width-and-height-with-javascript-342a88bf0bab
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const {height, width} = img;
        if (height !== width) {
          showError("Please upload a square image i.e height and width are the same");
        } else {
          fileToDataUrl(image).then((data) => {
            imageUrl = data;
          });
        }
      };
    };
  }

  apiCall('user?userId=' + window.localStorage.getItem('userId')  , 'GET', {})
    .then((data) => {
      const body = {};

      if (name !== data.name) body['name'] = name;
      if (email !== data.email) body['email'] = email;
      if (imageUrl !== undefined) body['image'] = imageUrl;
      if (password !== '') body['password'] = password;
    
      apiCall('user', 'PUT', body)
      .then(() => {
        hide('edit-profile');
        document.getElementById('view-profile-btn').click();
        document.getElementsByName('edit-profile-form')[0].reset();
      });
    });
});

// redirects the user to the view profile page from the edit user profile page when clicked
document.getElementById('back-btn').addEventListener('click', () => {
  hideShowPages('view-profile');
  document.getElementsByName('edit-profile-form')[0].reset();
});

// triggers a modal to show all watchees of a user
document.getElementById('watchees').addEventListener('click', () => {
  // reset modal
  document.getElementById('postModalBody').textContent = "";
  // update modal title
  document.getElementById('exampleModalLongTitle').textContent = "Watchees"

  const userId = window.localStorage.getItem('viewingUserId');

  // copying ndoes and filling the data
  apiCall('user?userId=' + userId  , 'GET', {})
    .then((data) => {
      const watcheeUserIds = data.watcheeUserIds;
      const node = document.getElementById("watchee-card");
      for (const userId of watcheeUserIds) {
        const clone = node.cloneNode(true);
        document.getElementById('postModalBody').appendChild(updateCloneIds(clone, userId));

        apiCall('user?userId=' + userId  , 'GET', {})
          .then((data) => {
            document.getElementById('watchee-card-username' + userId).addEventListener('click', usernamePressedFromWatchee);
            document.getElementById('watchee-card-username' + userId).textContent = data.name;

            if (data.image === undefined) {
              document.getElementById('watchee-card-profile-image' + userId).src = "/assets/default-profile-picture.png";
            } else {
              document.getElementById('watchee-card-profile-image' + userId).src = data.image;
            }
          });
        }
    });
});

// when the name of a user is pressed on a post it redirects 
// the user to the clicked users profile page
const profileButtonPressed = e => {
  const cardId = e.target.id;
  const postId = cardId.replace("card-username", "");
  findCreator(postId, 0)
}

// when the name of a user is pressed from a list of watchees 
// it redirects the user to the clicked users profile page
const usernamePressedFromWatchee = e => {
  const userId = e.target.id.replace("watchee-card-username", "");
  populateProfileFeed(userId);
  window.localStorage.setItem('viewingUserId', userId);
  document.getElementById('modal-close-btn').click();
  removeActive('view-profile-btn');
}

// populates the view profile page with all the feed cards (jobs made by that user)
export function populateProfileFeed(creatorId) {
  apiCall('user?userId=' + creatorId  , 'GET', {})
  .then((data) => {
    if (data.image !== undefined) {
      document.getElementById('profile-image').src = data.image;
    } else {
      document.getElementById('profile-image').src = "/assets/default-profile-picture.png";
    }
    document.getElementById('profile-username').textContent = data.name;
    document.getElementById('profile-email').textContent = data.email;
    if (data.watcheeUserIds.length === 1) {
      document.getElementById('watchees').textContent = data.watcheeUserIds.length + " watchee";
    } else {
      document.getElementById('watchees').textContent = data.watcheeUserIds.length + " watchees";
    }

    if (creatorId == localStorage.getItem('userId')) {
      document.getElementById('profile-action-btn').textContent = "Edit profile"
    } else {
      if (data.watcheeUserIds.includes(parseInt(localStorage.getItem('userId')))) {
        document.getElementById('profile-action-btn').textContent = "Unwatch user"
      } else {
        document.getElementById('profile-action-btn').textContent = "Watch user"
      }
    }
    resetFeed('view-profile');
    createFeedCards(data.jobs, 'profile-feed-body', 0);

    if (document.getElementById('profile-feed-body').textContent !== "") {
      hide('empty-profile-feed');
    }

    if (window.localStorage.getItem('userId') !== window.localStorage.getItem('viewingUserId')) {
      removeActive('view-profile-btn');
    } else {
      makeActive('view-profile-btn');
    }
  })
};

// allows the user to watch another user by entering the whatees email
document.getElementById('search-user-btn').addEventListener('click', () => {
  const email = document.getElementById('search-email').value;
  if (!validateEmail(email)) {
    document.getElementById('search-close-btn').click();
    showError('Email not valid');
    document.getElementsByName('search-modal-form')[0].reset();
    return;
  }     
  apiCall('user?userId=' + window.localStorage.getItem('userId')  , 'GET', {})
    .then((data) => {
      if (data.email === email) {
        document.getElementById('search-close-btn').click();
        showError('You cannot watch your own account.');
        document.getElementsByName('search-modal-form')[0].reset();
        return;
      }
    });

  const body = {
    email: email,
    turnon: true,
  };

  apiCall('user/watch' ,'PUT', body)
    .then(() => {
      document.getElementById('search-close-btn').click();
      document.getElementsByName('search-modal-form')[0].reset();
  });
});

/*******************************************************************************
 *                                 MILESTONE 5                                 *
 ******************************************************************************/

// redirects the user to a page to fill a form to post a job
document.getElementById('create-job-btn').addEventListener('click', () => {
  const title = document.getElementById('create-title').value;
  const start = document.getElementById('create-start-date').value;
  const description = document.getElementById('create-description').value;
  const image = document.getElementById('add-job-image').files[0];
  if (image !== undefined && start !== undefined && title.length > 0) {
    fileToDataUrl(image).then((data) => {
      let imageUrl = data;
      const body = {
        title: title,
        image: imageUrl,
        start: new Date(start).toISOString(),
        description: description
      };
      apiCall('job' , 'POST', body).then(() => {
        hide('add-job');
        document.getElementById('create-job-back-btn').click();
        document.getElementsByName('create-job-form')[0].reset();
      });
    });
  } else {
    showError("All required fields must be filled");
  }

});

// creates a job
document.getElementById('add-job-btn').addEventListener('click', () => {
  hideShowPages('add-job');
  removeMakeActive('add-job-btn');
});

// redirects the user from the add job page to the feed page, cancelling the creation 
// of the job
document.getElementById('create-job-back-btn').addEventListener('click', () => {
  hideShowPages('feed');
  removeMakeActive('show-feed-btn');
});

// allows the user to edit a job
document.getElementById('edit-job-btn').addEventListener('click', () => {
  const postId = parseInt(window.localStorage.getItem('postId'));
  const title = document.getElementById('edit-title').value;
  const startTime = document.getElementById('edit-start-date').value;
  const description = document.getElementById('edit-description').value;
  let body = {
    id: postId,
    title: title,
    start: startTime,
    description: description
  };
  const image = document.getElementById('edit-job-image').files[0];
  if (title.length === 0 || startTime === "") {
    showError("All required fields must be filled");
    return;
  }
  if (image !== undefined) {
    fileToDataUrl(image).then((data) => {
      body['image'] = data;
      apiCall('job', 'PUT', body)
      .then(() => {
        hideShowPages('edit-profile');
        document.getElementById('view-profile-btn').click();
      });
    });
  } else {
    apiCall('job', 'PUT', body)
    .then(() => {
      hideShowPages('edit-profile');
      document.getElementById('view-profile-btn').click();
      document.getElementsByName('edit-job-form')[0].reset();
    });
  }
});

// redirects the user form the edit job page to the view profile page
document.getElementById('edit-job-back-btn').addEventListener('click', () => {
  hideShowPages('view-profile');
  document.getElementsByName('edit-job-form')[0].reset();
});

// redirects the user to the edit job page
const editButtonPressed = e => {
  const postId = parseInt(e.target.id.replace("edit-post", ""));
  window.localStorage.setItem('postId', postId);
  apiCall('user?userId=' + window.localStorage.getItem('userId')  , 'GET', {})
    .then((data) => {
      for (const job of data.jobs) {
        if (job.id == postId) {
          document.getElementById('edit-title').value = job.title;
          document.getElementById('edit-start-date').value = new Date(job.start).toISOString().substr(0, 10);
          document.getElementById('edit-description').value = job.description;
          document.getElementById('edit-description').value = job.description;
          break;
        }
      }
      hide('view-profile');
      show('edit-job');
    });
}

// deletes a job
const deleteButtonPressed = e => {
  const body = {
    id: parseInt(e.target.id.replace("delete-post", "")),
  }

  apiCall('job', 'DELETE', body)
    .then(() => {
      resetFeed('view-profile');
      populateProfileFeed(window.localStorage.getItem('userId'));
    });
}

// triggers a modal to post a comment on a post
const commentButtonPressed = e => {
  const cardId = e.target.id;
  const postId = cardId.replace("comment-button", "");
  window.localStorage.setItem('postId', postId);
}

// posts a comment on a job post
document.getElementById('comment-submit-btn').addEventListener('click', () => {
  const comment = document.getElementById('comment').value;
  if (comment.length === 0) {
    document.getElementById('comment-modal-close-btn').click();
    window.localStorage.removeItem('postId');
    showError('Comments must be 1 or more characters');
    return;
  }

  const body = {
    id: window.localStorage.getItem('postId'),
    comment: comment
  };

  document.getElementById('comment-modal-close-btn').click();

  apiCall('job/comment', 'POST', body)
    .then ((data) => {
      // edit the button of the post
      let cardComment = document.getElementById('card-comments' +  window.localStorage.getItem('postId'));
      cardComment.textContent = (parseInt(cardComment.textContent.charAt(0)) + 1);
      if (cardComment.textContent === "1") {
        cardComment.textContent += ' comment';
      } else {
        cardComment.textContent += ' comments';
      }
      window.localStorage.removeItem('postId');
      document.getElementsByName('post-comment')[0].reset();
    });
});

/*******************************************************************************
 *                                 MILESTONE 6                                 *
 ******************************************************************************/
// allows for infinite scroll on the feed page
function addInfiniteScroll() {
  document.addEventListener('scroll', () => {
    let documentHeight = document.body.scrollHeight;
    let currentScroll = window.scrollY + window.innerHeight;
    // When the user is [modifier]px from the bottom, fire the event.
    let modifier = 400;
    if(document.getElementById('show-feed-btn').classList.contains("active") && !btmReached && currentScroll + modifier > documentHeight) {
      btmReached = true;
      populateFeed();
    }
  })
} 