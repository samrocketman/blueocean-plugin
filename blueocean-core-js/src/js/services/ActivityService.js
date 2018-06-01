import { Pager } from './Pager';
import { RestPaths } from '../paths/rest';
import { Fetch } from '../fetch';
import { BunkerService } from './BunkerService';
import { Utils } from '../utils';
import mobxUtils from 'mobx-utils';

/*
 * This class provides activity related services.
 *
 * @export
 * @class ActivityService
 * @extends {BunkerService}
 */
export class ActivityService extends BunkerService {
    /**
     * Generates a pager key for [@link PagerService] to store the [@link Pager] under.
     *
     * @param {string} organization Jenkins organization that this pager belongs to.
     * @param {string} pipeline Pipeline that this pager belongs to.
     * @param {string} branch Optional branch that this pager belongs to.
     * @returns {string} key for [@link PagerService]
     */
    pagerKey(organization, pipeline, branch) {
        return `Activities/${organization}-${pipeline}-${branch}`;
    }

    /**
     * Gets the activity pager
     *
     * @param {string} organization Jenkins organization that this pager belongs to.
     * @param {string} pipeline Pipeline that this pager belongs to.
     * @returns {Pager} Pager for this pipelne.
     */
    activityPager(organization, pipeline, branch) {
        return this.pagerService.getPager({
            key: this.pagerKey(organization, pipeline, branch),
            /**
             * Lazily generate the pager incase its needed.
             */
            lazyPager: () => new Pager(RestPaths.runs(organization, pipeline, branch), 25, this),
        });
    }

    /**
     * Gets an activity from the store.
     *
     * @param {string} href Self href for activity.
     * @returns {object} Mobx computed value
     */
    getActivity(href) {
        return this.getItem(href);
    }

    getTestSummary(href) {
        return this.getItem(href);
    }

    /**
     * Fetches an activity from rest api.
     *
     * Note: This only works for activities that are not in the queue.
     *
     * @param {string} href self href of activity.
     * @param {boolean} useCache Use the cache to lookup data or always fetch a new one.
     * @param {boolean} disableLoadingIndicator Hide the visual progress indicator displayed during fetch.
     * @returns {Promise} Promise of fetched data.
     */
    fetchActivity(href, { useCache, disableLoadingIndicator } = {}) {
        console.log('fetchActivity', href); // TODO: RM
        if (useCache && this.hasItem(href)) {
            console.log('   ...have in cache'); // TODO: RM
            console.log(JSON.stringify(this.getItem(href), null, 4)); // TODO: RM
            return Promise.resolve(this.getItem(href));
        }
        console.log('   ...fetching'); // TODO: RM

        return Fetch.fetchJSON(href, { disableLoadingIndicator })
            .then(data => {
                return this.setItem(data);
            })
            .catch(err => {
                console.log('There has been an error while trying to get the run data.', err); // FIXME: Ivan what is the way to return an "error" opbject so underlying component are aware of the problem and can react
            });
    }

    /**
     * Fetch a TestSummary for a run
     *
     * @param href (eg: myRun._links.testSummary.href )
     */
    fetchTestSummary(href) {
        console.log('fetchTestSummary', href); // TODO: RM
        if (this.hasItem(href)) {
            console.log('   ...have in cache'); // TODO: RM
            console.log(JSON.stringify(this.getItem(href), null, 4)); // TODO: RM
            return Promise.resolve(this.getItem(href));
        }

        console.log('   ...fetching'); // TODO: RM
        return Fetch.fetchJSON(href)
            .then(data => {
                const testSummary = Array.isArray(data) ? data[0] : data; // FIXME: This should go away at some point.
                console.log('got testSummary', testSummary); // TODO: RM
                return this.setItem(testSummary);
            })
            .catch(err => {
                console.log('There has been an error while trying to get the TestSummary data.', err); // FIXME: Ivan what is the way to return an "error" opbject so underlying component are aware of the problem and can react
            });
    }

    /**
     * Fetches artifacts for a given run.
     *
     * @param {string} runHref The href of the run to fetcfh artifacts for.
     * @returns {Object} Object containing zipFile link and list of artifacts.
     */
    fetchArtifacts(runHref) {
        return mobxUtils.fromPromise(Fetch.fetchJSON(`${runHref}artifacts/?start=0&limit=101`));
    }

    artifactsPager(runHref) {
        return this.pagerService.getPager({
            key: `${runHref}artifacts/`,
            /**
             * Lazily generate the pager incase its needed.
             */
            lazyPager: () => new Pager(`${runHref}artifacts/`, 100, this),
        });
    }
}
