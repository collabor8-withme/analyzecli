const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const argv = yargs
  .command('analyze', '分析依赖', {
    depth: {
      alias: 'd',
      describe: '递归深度',
      type: 'number',
      default: Infinity,
    },
    json: {
      describe: 'JSON输出路径',
      type: 'string',
    },
  })
  .help().argv;

const command = argv._[0];

if (command === 'analyze') {
  const depth = argv.depth;
  const jsonFilePath = argv.json;

  const packageJsonPath = path.join(process.cwd(), 'package.json');

  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = packageJson.dependencies || {};

    const dependencyGraph = {};

    function analyzeDependencies(dependencies, currentDepth, maxDepth, parentDependency = null) {
      if (currentDepth <= maxDepth) {
        for (const dependencyName in dependencies) {
          const dependencyVersion = dependencies[dependencyName];

          if (!dependencyGraph[parentDependency]) {
            dependencyGraph[parentDependency] = [];
          }
          dependencyGraph[parentDependency].push({ name: dependencyName, version: dependencyVersion });

          const dependentPackageJsonPath = path.resolve(
            __dirname,
            'node_modules',
            dependencyName,
            'package.json'
          );
          try {
            const dependentPackageJsonContent = fs.readFileSync(dependentPackageJsonPath, 'utf8');
            const dependentPackageJson = JSON.parse(dependentPackageJsonContent);

            const dependentDependencies = dependentPackageJson.dependencies || {};
            analyzeDependencies(dependentDependencies, currentDepth + 1, maxDepth, dependencyName);
          } catch (error) {
            console.error(`Error reading ${dependencyName}'s package.json:`, error.message);
          }
        }
      }
    }

    analyzeDependencies(dependencies, 0, depth);

    if (jsonFilePath) {
      fs.writeFileSync(jsonFilePath, JSON.stringify(dependencyGraph, null, 2));
      console.log(`Dependency graph saved to ${jsonFilePath}`);
    } else {
      console.log(JSON.stringify(dependencyGraph, null, 2));
    }

  } catch (error) {
    console.error('Error reading package.json:', error.message);
  }
}
