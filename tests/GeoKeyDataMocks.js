/**
 * AUTHENTICATION
 */

var authenticationMock = {
  access_token: 'xxxxxxxxxx',
  refresh_token: 'xxxxxxxxxx',
  expires_in: 3600
};

/**
 * LOCATION
 */

var locationMock = {
  id: 1,
  type: 'Feature',
  geometry: {},
  name: 'First location',
  created: '2015-09-15T09:40:01.747Z',
  properties: {
    height: 2,
    distance: 3.5,
    characteristics: null
  },
  measurements: []
};

/**
 * LOCATIONS
 */

var locationsMock = [];

locationsMock.push(locationMock);

/**
 * PROJECTS
 */

var projectsMock = [{
    id: 1,
    name: 'First project'
  },

  {
    id: 2,
    name: 'Second project'
  }
];
