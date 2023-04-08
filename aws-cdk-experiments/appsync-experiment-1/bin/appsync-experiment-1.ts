#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppsyncExperiment1Stack } from '../lib/appsync-experiment-1-stack';

const app = new cdk.App();
new AppsyncExperiment1Stack(app, 'AppsyncExperiment1Stack');
