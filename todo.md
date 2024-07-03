# A network simulation

## Goal
Test a personal implementation of the Dijkstra's path finding algorithm

## Dependencies

- Pygame

## Project progression

- [ ] Map manipulation
  - [x] Server creation (x coordinate, y coordinate,Ip address, website list)
    - [x] Server class
    - [x] Draw the servers
    - [x] Show a menu on left click
    - [x] Show the create server form
    - [x] Handle the duplicated IP error
  - [x] Add and delete websites on servers
    - [x] Server menu
    - [x] Select server
    - [x] Save changes made on a server
  - [x] Server suppression
  - [x] Link creation between servers with capacity duration
    - [x] Server context menu
    - [x] Linking mode
    - [x] Linking form
    - [x] Save the new link
    - [x] Draw links
    - [ ] Avoid multiple links between 2 servers
  - [x] Server drag
    - [x] Drag mode
  - [x] Disable server
- [x] DNS
  - [x] DNS implementation
  - [x] DNS update on server creation, server suppression and website list modification
  - [x] Url to IP addresses
- [x] Dijkstra's algorithm
  - [x] Url search on server
    - [x] Search form
    - [x] Find the closest path to the server which contains the requested url
    - [x] Highlight the closest path


# Maximum flow

- [x] Make the graph oriented
  - [x] Draw arrows
  - [x] Connection class
  - [x] Orientation attribute
