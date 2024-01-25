const InitEC2Manging = require('./ec2');

const ec2Manager = new InitEC2Manging();

ec2Manager.stopEC2Instances();
ec2Manager.terminateEC2Instances();