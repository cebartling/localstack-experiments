#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaExperiment1Stack } from '../lib/lambda-experiment-1-stack';

const app = new cdk.App();
new LambdaExperiment1Stack(app, 'LambdaExperiment1Stack');
